import * as admin from 'firebase-admin';

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
  createdAt: admin.firestore.Timestamp;
  lastLogin: admin.firestore.Timestamp;
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
  eventTimestamp: admin.firestore.Timestamp;
  xpAwarded: number;
  commitCount?: number; // Optional, as it might not apply to all activity types
  userFacingDescription: string;
  xpBreakdown: XpBreakdownItem[];
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
