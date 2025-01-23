import { CollectionReference, DocumentData, Firestore, Timestamp } from 'firebase-admin/firestore';
import { getCurrentTimeAsISO } from '../../firebase';
import { DatabaseInstance } from '../../firebase/firestore.util';

interface FirestoreTimestamps {
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export abstract class BaseFirestoreService<T extends DocumentData> {
  protected abstract collection: CollectionReference<T>;
  protected readonly db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  protected createTimestamps(): FirestoreTimestamps {
    const now = getCurrentTimeAsISO();
    return {
      createdAt: now,
      updatedAt: now,
    };
  }

  async findById(id: string): Promise<T | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? doc.data() : null;
  }

  async create(data: Omit<T, 'id' | keyof FirestoreTimestamps>): Promise<T> {
    const docRef = this.collection.doc();
    const timestamps = this.createTimestamps();

    const document = {
      id: docRef.id,
      ...data,
      ...timestamps,
    } as unknown as T;

    await docRef.set(document);
    return document;
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    await this.collection.doc(id).update({
      ...data,
      updatedAt: Timestamp.now(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
