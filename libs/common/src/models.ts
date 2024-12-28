import { Timestamp } from 'firebase-admin/firestore';
import { ConnectedAccountProvider } from './types';

// User Document
export interface User {
  userId: string;
  uid?: string; // via Firebase Auth
  email: string;
  githubUsername?: string;
  displayName: string;
  photoUrl: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  createdAt: string;
  lastLogin: string;
  active: boolean;
}

// Base details interface
export interface BaseEventDetails {
  authorId: string | null;
  authorExternalId?: string;
}

// Activity-specific details interfaces
export interface PushEventDetails extends BaseEventDetails {
  commitCount: number;
  branch: string;
}

export interface PullRequestEventDetails extends BaseEventDetails {
  prNumber: number;
  title: string;
  state: string;
}

// Activity Document
export interface Activity {
  activityId: string;
  type: string;
  source: ConnectedAccountProvider;
  repositoryId: string;
  repositoryName: string;
  eventId: string;
  eventTimestamp: string; // Changed from Timestamp to string (ISO format)
  userFacingDescription: string;
  details: PushEventDetails | PullRequestEventDetails | (BaseEventDetails & Record<string, unknown>);
}


