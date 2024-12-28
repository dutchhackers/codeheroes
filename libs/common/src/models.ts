import { Timestamp } from 'firebase-admin/firestore';
import { ConnectedAccountProvider } from './types';

// User Document
export interface User {
  uid?: string;
  userId: string; // obsolete?
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

// XP Breakdown Item
export interface XpBreakdownItem {
  description: string;
  xp: number;
}


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


