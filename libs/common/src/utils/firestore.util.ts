import { getFirestore, Firestore, Settings } from 'firebase-admin/firestore';

export function getConfiguredFirestore(): Firestore {
  const db = getFirestore();
  const settings: Settings = {
    ignoreUndefinedProperties: true
  };
  db.settings(settings);
  return db;
}
