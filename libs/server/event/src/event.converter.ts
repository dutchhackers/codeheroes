import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { Event } from './event.model';

export const eventConverter: FirestoreDataConverter<Event> = {
  toFirestore: (user: Event): DocumentData => {
    return user;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): Event => {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is undefined');
    }
    // Destructure to omit createdAt and lastLogin
    const { createdAt, updatedAt, ...restData } = data;
    return {
      id: snapshot.id,
      ...restData,
    } as Event;
  },
};
