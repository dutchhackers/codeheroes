import * as admin from 'firebase-admin';
import { UserActivity, User, WebhookEvent } from '../models';

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

export const eventConverter: admin.firestore.FirestoreDataConverter<WebhookEvent> = {
  toFirestore: (user: WebhookEvent): admin.firestore.DocumentData => {
    return user;
  },
  fromFirestore: (snapshot: admin.firestore.QueryDocumentSnapshot): WebhookEvent => {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is undefined');
    }
    // Destructure to omit createdAt and lastLogin
    const { createdAt, updatedAt, ...restData } = data;
    return {
      id: snapshot.id,
      ...restData,
    } as WebhookEvent;
  },
};

export const activityConverter: admin.firestore.FirestoreDataConverter<UserActivity> =
  {
    toFirestore: (user: UserActivity): admin.firestore.DocumentData => {
      return user;
    },
    fromFirestore: (
      snapshot: admin.firestore.QueryDocumentSnapshot
    ): UserActivity => {
      const data = snapshot.data();
      if (!data) {
        throw new Error('Document data is undefined');
      }
      // Destructure to omit createdAt and lastLogin
      const { createdAt, updatedAt, ...restData } = data;
      return {
        id: snapshot.id,
        ...restData,
      } as UserActivity;
    },
  };
