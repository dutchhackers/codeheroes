import { BaseDocument } from '../models';
import { ConnectedAccountProvider } from '../types';

// Base details interface
export interface BaseEventDetails {
  authorId: string | null;
  authorExternalId?: string;
  repositoryId: string;
  repositoryName: string;
  repositoryOwner: string;
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

// Event Document
export interface Event extends BaseDocument {
  activityId: string;
  type: string;
  source: ConnectedAccountProvider;
  eventId: string;
  eventTimestamp: string; // ISO string
  description?: string;
  details:
    | PushEventDetails
    | PullRequestEventDetails
    | (BaseEventDetails & Record<string, unknown>);
}

export type CreateEventInput = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;
