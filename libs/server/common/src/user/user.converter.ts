import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { User } from './user.model';

// --- Firestore Data Converter ---
export const userConverter: FirestoreDataConverter<User> = {
  toFirestore: (user: User): DocumentData => {
    return user;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): User => {
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
