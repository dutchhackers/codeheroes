import { ConnectedAccountProvider } from "../types";

// Base details interface
export interface BaseEventDetails {
  authorId: string | null;
  authorExternalId?: string;
  repositoryId: string;
  repositoryName: string;
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
  eventId: string;
  eventTimestamp: string; // Changed from Timestamp to string (ISO format)
  userFacingDescription: string;
  details:
    | PushEventDetails
    | PullRequestEventDetails
    | (BaseEventDetails & Record<string, unknown>);
}
