import { BaseDocument, ConnectedAccountProvider } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { ActivityType } from '@codeheroes/shared/types';
import {
  IssueActivityMetrics,
  PullRequestActivityMetrics,
  PushActivityMetrics,
  ReviewActivityMetrics,
  ReviewThreadActivityMetrics,
} from './metrics.types';

export interface ActivityHandler {
  canHandle(event: Event): boolean;
  handle(event: Event): ActivityData;
  generateDescription(event: Event): string;
  getActivityType(): ActivityType;
}

export interface BaseActivityData<T = undefined> {
  type: string;
  metrics?: T;
}

export interface UserActivity extends BaseDocument {
  type: ActivityType;
  eventId: string;
  userId: string;
  provider: ConnectedAccountProvider;
  eventType: string;
  userFacingDescription: string;
  data?: ActivityData;
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
export interface IssueActivityData extends BaseActivityData<IssueActivityMetrics> {
  type: 'issue';
  issueNumber: number;
  title: string;
  state: string;
  stateReason?: string | null;
}

export interface PullRequestActivityData extends BaseActivityData<PullRequestActivityMetrics> {
  type: 'pull_request';
  prNumber: number;
  title: string;
  merged: boolean;
  draft: boolean;
  action: string;
}

export interface PushActivityData extends BaseActivityData<PushActivityMetrics> {
  type: 'push';
  branch: string;
  commitCount: number;
}

export interface ReviewActivityData extends BaseActivityData<ReviewActivityMetrics> {
  type: 'review';
  prNumber: number;
  state: 'approved' | 'changes_requested' | 'commented' | 'dismissed';
  submittedAt: string;
}

export interface ReviewThreadActivityData extends BaseActivityData<ReviewThreadActivityMetrics> {
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

export interface CreateBranchActivityData extends BaseActivityData {
  type: 'create_branch';
  ref: string;
}

export interface CreateTagActivityData extends BaseActivityData {
  type: 'create_tag';
  ref: string;
}

export interface DeleteBranchActivityData extends BaseActivityData {
  type: 'delete_branch';
  ref: string;
}

export interface DeleteTagActivityData extends BaseActivityData {
  type: 'delete_tag';
  ref: string;
}

export type ActivityData =
  | IssueActivityData
  | PullRequestActivityData
  | PushActivityData
  | ReviewActivityData
  | ReviewThreadActivityData
  | ReviewCommentActivityData
  | DeploymentActivityData
  | CreateBranchActivityData
  | CreateTagActivityData
  | DeleteBranchActivityData
  | DeleteTagActivityData;
