import { BaseDocument } from './common.model';
import { EventSource } from './event.model';

interface BaseActivityData {
  type: string;
}

export interface PushActivityData extends BaseActivityData {
  type: 'push';
  commitCount: number;
  branch: string;
}

export interface PullRequestActivityData extends BaseActivityData {
  type: 'pull_request';
  prNumber: number;
  title: string;
  merged: boolean;
}

export interface IssueActivityData extends BaseActivityData {
  type: 'issue';
  issueNumber: number;
  title: string;
}

export type ActivityData = PushActivityData | PullRequestActivityData | IssueActivityData;

export interface UserActivity extends BaseDocument {
  action: string;
  eventId: string; // In the future this might become an optional field
  userId: string;
  eventSource: EventSource;
  userFacingDescription: string;
  data?: ActivityData;
}

export type CreateActivityInput = Omit<UserActivity, 'id' | 'createdAt' | 'updatedAt'>;
