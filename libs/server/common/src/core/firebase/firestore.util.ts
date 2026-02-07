import { getFirestore, Firestore, Settings } from 'firebase-admin/firestore';

export class DatabaseInstance {
  private static instance: Firestore;

  private static initialize() {
    const db = getFirestore();
    try {
      const settings: Settings = {
        ignoreUndefinedProperties: true,
      };
      db.settings(settings);
    } catch {
      // settings() throws if Firestore was already initialized (e.g. by admin.initializeApp())
    }
    return db;
  }

  static getInstance(): Firestore {
    if (!DatabaseInstance.instance) {
      DatabaseInstance.instance = DatabaseInstance.initialize();
    }
    return DatabaseInstance.instance;
  }
}
