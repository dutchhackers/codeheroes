import { ActivityType, BaseDocument, ConnectedAccountProvider } from '@codeheroes/shared/types';

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

export interface BaseActivityData<T = undefined> {
  type: string;
  metrics?: T;
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

// Code activity metrics
export interface PushActivityMetrics {
  commits: number;
}

// Pull request metrics
export interface PullRequestActivityMetrics {
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
}

// Review metrics
export interface ReviewActivityMetrics {
  commentCount?: number;
  threadCount?: number;
  timeToComplete?: number;
  linesReviewed?: number;
}

// Thread metrics
export interface ReviewThreadActivityMetrics {
  commentCount: number;
  timeToResolve?: number;
}

// Issue metrics
export interface IssueActivityMetrics {
  commentCount?: number;
  timeToClose?: number;
  timeToFirstResponse?: number;
}

export type ActivityMetrics =
  | PushActivityMetrics
  | PullRequestActivityMetrics
  | ReviewActivityMetrics
  | ReviewThreadActivityMetrics
  | IssueActivityMetrics
  | undefined;
