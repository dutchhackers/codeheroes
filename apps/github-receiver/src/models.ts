import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// User Document
export interface User {
  userId: string;
  githubUsername: string;
  heroName: string;
  heroAvatarUrl: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  repositories?: string[]; // Optional, consider making this a subcollection
  createdAt: Timestamp; // ISO date string
  lastLogin: Timestamp; // ISO date string
}

// XP Breakdown Item
export interface XpBreakdownItem {
  description: string;
  xp: number;
}

export type ConnectedAccountProvider =
  | 'github'
  | 'strava'
  | 'azure'
  | 'bitbucket';

// Activity Document
export interface Activity {
  activityId: string;
  type: string; // Consider using an enum for activity types (see below)
  source: ConnectedAccountProvider;
  repositoryId: string;
  repositoryName: string;
  branch: string;
  eventId: string;
  eventTimestamp: Timestamp;
  xpAwarded: number;
  commitCount?: number; // Optional, as it might not apply to all activity types
  userFacingDescription: string;
  xpBreakdown: XpBreakdownItem[];
  authorId: string | null;
  authorExternalId?: string;
}

// Optional: Enum for Activity Types
export enum ActivityType {
  COMMIT = 'COMMIT',
  PUSH = 'PUSH',
  PULL_REQUEST_OPENED = 'PULL_REQUEST_OPENED',
  PULL_REQUEST_MERGED = 'PULL_REQUEST_MERGED',
  PULL_REQUEST_REVIEWED = 'PULL_REQUEST_REVIEWED',
  WORKFLOW_RUN_COMPLETED = 'WORKFLOW_RUN_COMPLETED',
  // ... other activity types
}

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
