import { BaseDocument, ConnectedAccountProvider } from '.';

enum EventType {
  PUSH = 'PUSH',
  PULL_REQUEST_OPENED = 'PULL_REQUEST_OPENED',
  PULL_REQUEST_MERGED = 'PULL_REQUEST_MERGED',
  PULL_REQUEST_REVIEWED = 'PULL_REQUEST_REVIEWED',
  WORKFLOW_RUN_COMPLETED = 'WORKFLOW_RUN_COMPLETED',
  ISSUE_OPENED = 'ISSUE_OPENED',
  ISSUE_CLOSED = 'ISSUE_CLOSED',
  ISSUE_UPDATED = 'ISSUE_UPDATED',
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

export interface IssueEventDetails extends BaseEventDetails {
  issueNumber: number;
  title: string;
  state: string;
  action: string;
}

// Event Document
export interface WebhookEvent extends BaseDocument {
  action: string; // e.g. 'github.push', 'github.pull_request.opened', 'github.pull_request.merged'
  source: ConnectedAccountProvider;
  eventId: string;
  eventTimestamp: string; // ISO string
  details:
    | PushEventDetails
    | PullRequestEventDetails
    | IssueEventDetails
    | (BaseEventDetails & Record<string, unknown>);
  processed: boolean;
}

export type CreateEventInput = Omit<WebhookEvent, 'id' | 'createdAt' | 'updatedAt'>;
