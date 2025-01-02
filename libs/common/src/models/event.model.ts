import { BaseDocument, ConnectedAccountProvider } from '.';

export enum EventType {
  PUSH = 'PUSH',
  PULL_REQUEST_OPENED = 'PULL_REQUEST_OPENED',
  PULL_REQUEST_MERGED = 'PULL_REQUEST_MERGED',
  PULL_REQUEST_REVIEWED = 'PULL_REQUEST_REVIEWED',
  WORKFLOW_RUN_COMPLETED = 'WORKFLOW_RUN_COMPLETED',
}


// Base details interface
export interface BaseEventDetails {
  authorId: string | null;
  authorExternalId?: string;
  repositoryId: string;
  repositoryName: string;
  repositoryOwner: string;
  lastCommitMessage?: string;
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
export interface WebhookEvent extends BaseDocument {
  source: ConnectedAccountProvider;
  eventId: string;
  eventTimestamp: string; // ISO string
  activityType: string;
  details:
    | PushEventDetails
    | PullRequestEventDetails
    | (BaseEventDetails & Record<string, unknown>);
  processed: boolean;
}

export type CreateEventInput = Omit<WebhookEvent, 'id' | 'createdAt' | 'updatedAt'>;
