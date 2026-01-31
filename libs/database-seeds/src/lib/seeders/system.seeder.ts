import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { Seeder } from '../types/seeder.interface';

interface SystemSettings {
  allowedDomains: string[];
}

interface SystemCounters {
  nextUserId: number;
  updatedAt: Timestamp;
}

interface SystemData {
  settings?: SystemSettings;
  counters?: SystemCounters;
}

export class SystemSeeder implements Seeder<SystemData> {
  async seed(db: Firestore, data: SystemData[]): Promise<void> {
    const systemData = data[0]; // Expect single object with settings and counters
    const batch = db.batch();

    if (systemData.settings) {
      const settingsRef = db.collection('system').doc('settings');
      batch.set(settingsRef, {
        ...systemData.settings,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log('Seeding system/settings with allowedDomains:', systemData.settings.allowedDomains);
    }

    if (systemData.counters) {
      const countersRef = db.collection('system').doc('counters');
      batch.set(countersRef, {
        ...systemData.counters,
        updatedAt: Timestamp.now(),
      });
      console.log('Seeding system/counters with nextUserId:', systemData.counters.nextUserId);
    }

    await batch.commit();
  }

  async clear(db: Firestore): Promise<void> {
    const batch = db.batch();
    batch.delete(db.collection('system').doc('settings'));
    batch.delete(db.collection('system').doc('counters'));
    await batch.commit();
  }
}
