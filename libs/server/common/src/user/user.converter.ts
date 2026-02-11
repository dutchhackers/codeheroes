import * as admin from 'firebase-admin';
import { User } from './user.model';

// --- Firestore Data Converter ---
export const userConverter: admin.firestore.FirestoreDataConverter<User> = {
  toFirestore: (user: User): admin.firestore.DocumentData => {
    return user;
  },
  fromFirestore: (snapshot: admin.firestore.QueryDocumentSnapshot): User => {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is undefined');
    }
    return {
      id: snapshot.id,
      ...data,
    } as User;
  },
};
