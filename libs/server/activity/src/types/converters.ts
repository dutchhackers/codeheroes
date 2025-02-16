import * as admin from 'firebase-admin';
import { UserActivity } from '@codeheroes/common';

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

/*


// types/converters.ts
import * as admin from 'firebase-admin';
import { UserActivity } from './activity.interfaces';

export const activityConverter: admin.firestore.FirestoreDataConverter<UserActivity> = {
  toFirestore: (activity: UserActivity): admin.firestore.DocumentData => {
    // Remove any potential undefined fields
    const {
      id,
      createdAt,
      updatedAt,
      ...rest
    } = activity;

    // Return a clean object for Firestore
    return {
      ...rest,
      createdAt: createdAt || admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: updatedAt || admin.firestore.FieldValue.serverTimestamp(),
    };
  },
  fromFirestore: (
    snapshot: admin.firestore.QueryDocumentSnapshot
  ): UserActivity => {
    const data = snapshot.data();

    // Ensure all required fields are present
    if (!data) {
      throw new Error(`Document data is undefined for id: ${snapshot.id}`);
    }

    // Convert Firestore Timestamps to Dates
    const createdAt = data.createdAt?.toDate();
    const updatedAt = data.updatedAt?.toDate();

    // Return properly typed UserActivity
    return {
      id: snapshot.id,
      ...data,
      createdAt,
      updatedAt,
    } as UserActivity;
  },
};
*/
