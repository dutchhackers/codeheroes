import { BaseFirestoreService } from './base.service';

export interface StudioOption {
  id: string;
  label: string;
  country?: string;
  active: boolean;
}

export interface DisciplineOption {
  id: string;
  label: string;
  active: boolean;
}

interface SystemSettings {
  allowedDomains?: string[];
  studios?: StudioOption[];
  disciplines?: DisciplineOption[];
  // Add other system settings here as needed
}

export class SettingsService extends BaseFirestoreService<SystemSettings> {
  protected collection = this.db.collection('system').withConverter<SystemSettings>({
    toFirestore: (data) => data,
    fromFirestore: (snap) => snap.data() as SystemSettings,
  });
  private settingsRef = this.collection.doc('settings');

  async getAllowedDomains(): Promise<string[]> {
    const doc = await this.settingsRef.get();
    return doc.exists ? doc.data()?.allowedDomains || [] : [];
  }

  async setAllowedDomains(domains: string[]): Promise<void> {
    await this.settingsRef.set(
      {
        allowedDomains: domains,
        ...this.updateTimestamps(),
      },
      { merge: true },
    );
  }

  async getStudios(): Promise<StudioOption[]> {
    const doc = await this.settingsRef.get();
    return doc.exists ? doc.data()?.studios || [] : [];
  }

  async getDisciplines(): Promise<DisciplineOption[]> {
    const doc = await this.settingsRef.get();
    return doc.exists ? doc.data()?.disciplines || [] : [];
  }

  async getOptions(): Promise<{ studios: StudioOption[]; disciplines: DisciplineOption[] }> {
    const doc = await this.settingsRef.get();
    const data = doc.exists ? doc.data() : undefined;
    return {
      studios: data?.studios || [],
      disciplines: data?.disciplines || [],
    };
  }
}
