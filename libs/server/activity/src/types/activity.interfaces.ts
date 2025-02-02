import { BaseDocument, ConnectedAccountProvider } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { ActivityType } from './activity.types';
import { ActivityMetrics } from './metrics.types';

export interface ActivityHandler {
  canHandle(event: Event): boolean;
  handle(event: Event): ActivityData;
  getMetrics(event: Event): ActivityMetrics;
  generateDescription(event: Event): string;
  getActivityType(): ActivityType;
}

export interface BaseActivityData {
  type: string;
}

export interface UserActivity extends BaseDocument {
  type: ActivityType;
  eventId: string;
  userId: string;
  provider: ConnectedAccountProvider;
  eventType: string;
  externalEventId: string;
  userFacingDescription: string;
  data?: ActivityData;
  metrics?: ActivityMetrics;
  processingResult?: ActivityProcessingResult;
}

export interface ActivityProcessingResult {
  xpEarned: number;
  achievements?: string[];
  bonuses?: {
    type: string;
    amount: number;
    reason: string;
  }[];
}

// Activity Data Types
export interface IssueActivityData extends BaseActivityData {
  type: 'issue';
  issueNumber: number;
  title: string;
  state: string;
  stateReason?: string | null;
}

export interface PullRequestActivityData extends BaseActivityData {
  type: 'pull_request';
  prNumber: number;
  title: string;
  merged: boolean;
  draft: boolean;
  action: string;
}

export interface PushActivityData extends BaseActivityData {
  type: 'push';
  branch: string;
  commitCount: number;
}

export interface ReviewActivityData extends BaseActivityData {
  type: 'review';
  prNumber: number;
  state: 'approved' | 'changes_requested' | 'commented' | 'dismissed';
  submittedAt: string;
}

export interface ReviewThreadActivityData extends BaseActivityData {
  type: 'review_thread';
  prNumber: number;
  threadId: number;
  resolved: boolean;
}

export interface ReviewCommentActivityData extends BaseActivityData {
  type: 'review_comment';
  prNumber: number;
  commentId: number;
  inReplyToId?: number;
}

export interface DeploymentActivityData extends BaseActivityData {
  type: 'deployment';
  environment: string;
  status: 'pending' | 'success' | 'failure';
}

export type ActivityData =
  | IssueActivityData
  | PullRequestActivityData
  | PushActivityData
  | ReviewActivityData
  | ReviewThreadActivityData
  | ReviewCommentActivityData
  | DeploymentActivityData;
