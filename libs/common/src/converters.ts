import * as admin from 'firebase-admin';
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

export const activityConverter: admin.firestore.FirestoreDataConverter<Activity> =
  {
    toFirestore: (activity: Activity): admin.firestore.DocumentData => {
      return {
        activityId: activity.activityId,
        type: activity.type,
        source: activity.source,
        eventId: activity.eventId,
        eventTimestamp: activity.eventTimestamp,
        userFacingDescription: activity.userFacingDescription,
        details: activity.details,
      };
    },
    fromFirestore: (
      snapshot: admin.firestore.QueryDocumentSnapshot
    ): Activity => {
      const data = snapshot.data();
      if (!data) {
        throw new Error('Document data is undefined');
      }

      return {
        activityId: data.activityId,
        type: data.type,
        source: data.source,
        eventId: data.eventId,
        eventTimestamp: data.eventTimestamp,
        userFacingDescription: data.userFacingDescription,
        details: data.details,
      };
    },
  };
