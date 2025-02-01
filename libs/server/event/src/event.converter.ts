import * as admin from 'firebase-admin';
import { Event } from './event.model';

export const eventConverter: admin.firestore.FirestoreDataConverter<Event> = {
  toFirestore: (user: Event): admin.firestore.DocumentData => {
    return user;
  },
  fromFirestore: (snapshot: admin.firestore.QueryDocumentSnapshot): Event => {
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
