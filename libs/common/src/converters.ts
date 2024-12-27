import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { User, Activity } from './models';

// --- Firestore Data Converters ---
export const userConverter: admin.firestore.FirestoreDataConverter<User> = {
  toFirestore: (user: User): admin.firestore.DocumentData => {
    console.log('toFirestore', user);
    return {
      userId: user.userId,
      githubUsername: user.githubUsername,
      heroName: user.heroName,
      heroAvatarUrl: user.heroAvatarUrl,
      level: user.level,
      xp: user.xp,
      xpToNextLevel: user.xpToNextLevel,
      createdAt: FieldValue.serverTimestamp(),
      lastLogin: FieldValue.serverTimestamp(),
    };
  },
  fromFirestore: (snapshot: admin.firestore.QueryDocumentSnapshot): User => {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is undefined');
    }
    return {
      userId: data.userId,
      githubUsername: data.githubUsername,
      heroName: data.heroName,
      heroAvatarUrl: data.heroAvatarUrl,
      level: data.level,
      xp: data.xp,
      xpToNextLevel: data.xpToNextLevel,
      createdAt: data.createdAt,
      lastLogin: data.lastLogin,
    };
  },
};

export const activityConverter: admin.firestore.FirestoreDataConverter<Activity> =
  {
    toFirestore: (activity: Activity): admin.firestore.DocumentData => {
      const doc: admin.firestore.DocumentData = {
        activityId: activity.activityId,
        type: activity.type,
        source: activity.source,
        repositoryId: activity.repositoryId,
        repositoryName: activity.repositoryName,
        branch: activity.branch,
        eventId: activity.eventId,
        eventTimestamp: activity.eventTimestamp,
        xpAwarded: activity.xpAwarded,
        commitCount: activity.commitCount,
        userFacingDescription: activity.userFacingDescription,
        xpBreakdown: activity.xpBreakdown,
        authorId: activity.authorId,
      };

      if (activity.authorExternalId !== undefined) {
        doc.authorExternalId = activity.authorExternalId;
      }

      return doc;
    },
    fromFirestore: (
      snapshot: admin.firestore.QueryDocumentSnapshot
    ): Activity => {
      const data = snapshot.data();
      if (!data) {
        throw new Error('Document data is undefined');
      }

      // Perform any necessary data transformation here

      return {
        activityId: data.activityId,
        type: data.type,
        source: data.source,
        repositoryId: data.repositoryId,
        repositoryName: data.repositoryName,
        branch: data.branch,
        eventId: data.eventId,
        eventTimestamp: data.eventTimestamp,
        xpAwarded: data.xpAwarded,
        commitCount: data.commitCount,
        userFacingDescription: data.userFacingDescription,
        xpBreakdown: data.xpBreakdown,
        authorId: data.authorId,
        authorExternalId: data.authorExternalId,
      };
    },
  };
