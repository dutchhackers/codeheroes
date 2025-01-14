import { BaseDocument } from './common.model';
import { EventSource } from './event.model';

// Base interfaces
interface BaseActivityData {
  type: string;
}

// User interfaces
export interface CreateUserInput {
  uid?: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
}

// later TODO: User could additionaly extend UserXpData
export interface User extends BaseDocument {
  email: string;
  displayName: string;
  photoUrl: string;
  lastLogin: string;
  active: boolean;
  uid?: string;
}

// Activity data interfaces
export interface IssueActivityData extends BaseActivityData {
  type: 'issue';
  issueNumber: number;
  title: string;
}

export interface PullRequestActivityData extends BaseActivityData {
  type: 'pull_request';
  prNumber: number;
  title: string;
  merged: boolean;
}

export interface PushActivityData extends BaseActivityData {
  type: 'push';
  commitCount: number;
  branch: string;
}

export type ActivityData = IssueActivityData | PullRequestActivityData | PushActivityData;

// Activity interfaces
export interface UserActivity extends BaseDocument {
  action: string;
  eventId: string; // In the future this might become an optional field
  userId: string;
  eventSource: EventSource;
  userFacingDescription: string;
  data?: ActivityData;
}

