import * as admin from 'firebase-admin';
import { Event } from './interfaces';
import { Activity, User } from './models';

// --- Firestore Data Converters ---
export const userConverter: admin.firestore.FirestoreDataConverter<User> = {
  toFirestore: (user: User): admin.firestore.DocumentData => {
    return user;
  },
  fromFirestore: (snapshot: admin.firestore.QueryDocumentSnapshot): User => {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is undefined');
    }
    // Destructure to omit createdAt and lastLogin
    const { createdAt, updatedAt, ...restData } = data;
    return {
      id: snapshot.id,
      ...restData,
    } as User;
  },
};

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

export const activityConverter: admin.firestore.FirestoreDataConverter<Activity> =
  {
    toFirestore: (user: Activity): admin.firestore.DocumentData => {
      return user;
    },
    fromFirestore: (
      snapshot: admin.firestore.QueryDocumentSnapshot
    ): Activity => {
      const data = snapshot.data();
      if (!data) {
        throw new Error('Document data is undefined');
      }
      // Destructure to omit createdAt and lastLogin
      const { createdAt, updatedAt, ...restData } = data;
      return {
        id: snapshot.id,
        ...restData,
      } as Activity;
    },
  };
