import {
  CollectionReference,
  DocumentData,
  Timestamp,
} from 'firebase-admin/firestore';

interface FirestoreTimestamps {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export abstract class BaseFirestoreService<T extends DocumentData> {
  protected abstract collection: CollectionReference<T>;

  protected createTimestamps(): FirestoreTimestamps {
    return {
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
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
