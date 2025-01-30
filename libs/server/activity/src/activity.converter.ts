import * as admin from 'firebase-admin';
import { UserActivity } from './activity.model';

export const activityConverter: admin.firestore.FirestoreDataConverter<UserActivity> = {
  toFirestore: (user: UserActivity): admin.firestore.DocumentData => {
    return user;
  },
  fromFirestore: (snapshot: admin.firestore.QueryDocumentSnapshot): UserActivity => {
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
