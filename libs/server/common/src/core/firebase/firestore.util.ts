import { getFirestore, Firestore, Settings } from 'firebase-admin/firestore';

export class DatabaseInstance {
  private static instance: Firestore;

  private static initialize() {
    const db = getFirestore();
    const settings: Settings = {
      ignoreUndefinedProperties: true,
    };
    db.settings(settings);
    return db;
  }

  static getInstance(): Firestore {
    if (!DatabaseInstance.instance) {
      DatabaseInstance.instance = DatabaseInstance.initialize();
    }
    return DatabaseInstance.instance;
  }
}
