import { Firestore } from 'firebase-admin/firestore';

export interface Seeder<T> {
  seed(db: Firestore, data: T[]): Promise<void>;
  clear(db: Firestore): Promise<void>;
}
