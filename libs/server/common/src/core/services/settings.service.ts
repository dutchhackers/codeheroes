import { BaseFirestoreService } from './base.service';

interface SystemSettings {
  allowedDomains?: string[];
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
}
