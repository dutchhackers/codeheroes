import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Activity, User } from './models';

// --- Firestore Data Converters ---
export const userConverter: admin.firestore.FirestoreDataConverter<User> = {
  toFirestore: (user: User): admin.firestore.DocumentData => {
    console.log('toFirestore', user);
    const doc: admin.firestore.DocumentData = {
      ...user,
      createdAt: Timestamp.now().toDate().toISOString(),
      lastLogin: Timestamp.now().toDate().toISOString(),
    };

    if (user.githubUsername) {
      doc.githubUsername = user.githubUsername;
    }

    return doc;
  },
  fromFirestore: (snapshot: admin.firestore.QueryDocumentSnapshot): User => {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is undefined');
    }
    console.log({
      ...data,
      // createdAt: data.createdAt?.toDate().toISOString,
      // lastLogin: data.lastLogin?.toDate(),
      userId: snapshot.id,
    })
    return {
      ...data,
      // createdAt: data.createdAt?.toDate().toISOString,
      // lastLogin: data.lastLogin?.toDate(),
      userId: snapshot.id,
    } as User;
  },
};

export const activityConverter: admin.firestore.FirestoreDataConverter<Activity> = {
  toFirestore: (activity: Activity): admin.firestore.DocumentData => {
    return {
      activityId: activity.activityId,
      type: activity.type,
      source: activity.source,
      repositoryId: activity.repositoryId,
      repositoryName: activity.repositoryName,
      eventId: activity.eventId,
      eventTimestamp: activity.eventTimestamp,
      userFacingDescription: activity.userFacingDescription,
      details: activity.details,
    };
  },
  fromFirestore: (snapshot: admin.firestore.QueryDocumentSnapshot): Activity => {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is undefined');
    }

    return {
      activityId: data.activityId,
      type: data.type,
      source: data.source,
      repositoryId: data.repositoryId,
      repositoryName: data.repositoryName,
      eventId: data.eventId,
      eventTimestamp: data.eventTimestamp,
      userFacingDescription: data.userFacingDescription,
      details: data.details,
    };
  },
};
