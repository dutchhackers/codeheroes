import { BaseDocument, ConnectedAccountProvider } from '@codeheroes/common';

export interface ActivityMetrics {
  [key: string]: number | undefined;
}

export interface PushActivityMetrics extends ActivityMetrics {
  commits: number;
}

export interface PullRequestActivityMetrics extends ActivityMetrics {
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  timeInvested: number; // in seconds
}

// Base interfaces
interface BaseActivityData {
  type: string;
}

// Activity data interfaces
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
  action: string; // Add this field
  updatedAt?: string;
}

export interface PushActivityData extends BaseActivityData {
  type: 'push';
  branch: string;
}

export interface ReviewActivityData extends BaseActivityData {
  type: 'review';
  prNumber: number;
  state: 'approved' | 'changes_requested' | 'commented' | 'dismissed';
  submittedAt: string;
  updatedAt?: string;
}

export interface ReviewThreadActivityData extends BaseActivityData {
  type: 'review_thread';
  prNumber: number;
  threadId: number;
  resolved: boolean;
  resolvedAt?: string;
}

export interface ReviewCommentActivityData extends BaseActivityData {
  type: 'review_comment';
  prNumber: number;
  commentId: number;
  inReplyToId?: number;
}

// Activity interfaces
export interface UserActivity extends BaseDocument {
  type: ActivityType;
  eventId: string; // In the future this might become an optional field
  userId: string;
  provider: ConnectedAccountProvider;
  eventType: string;
  externalEventId: string;
  userFacingDescription?: string; // Optional for time being
  data?: ActivityData;
  metrics?: ActivityMetrics;
  processingResult?: any; //ActivityProcessingResult; // replaces xp field
}

// Update ActivityData type union
export type ActivityData =
  | IssueActivityData
  | PullRequestActivityData
  | PushActivityData
  | ReviewActivityData
  | ReviewThreadActivityData
  | ReviewCommentActivityData;

/**
 * Provider-agnostic activity types that can occur within a development workflow.
 * These types represent standardized development activities regardless of the source
 * (e.g. GitHub, GitLab, Bitbucket, etc).
 *
 * @enum {string}
 *
 * Core coding activities include:
 * - Code pushes and commits
 * - Pull request lifecycle events
 * - Issue tracking events
 * - Code review interactions
 *
 * Additional activities track:
 * - Code quality metrics
 * - Deployment events
 */
export enum ActivityType {
  // Core coding activities;
  CODE_PUSH = 'CODE_PUSH',
  PR_CREATED = 'PR_CREATED',
  PR_UPDATED = 'PR_UPDATED',
  PR_MERGED = 'PR_MERGED',
  PR_REVIEW = 'PR_REVIEW',
  ISSUE_CREATED = 'ISSUE_CREATED',
  ISSUE_CLOSED = 'ISSUE_CLOSED',
  ISSUE_UPDATED = 'ISSUE_UPDATED',
  ISSUE_REOPENED = 'ISSUE_REOPENED',

  // Additional (future) activities
  CODE_COVERAGE = 'CODE_COVERAGE',
  DEPLOYMENT = 'DEPLOYMENT',

  // New activity types
  PR_REVIEW_SUBMITTED = 'PR_REVIEW_SUBMITTED',
  PR_REVIEW_UPDATED = 'PR_REVIEW_UPDATED',
  PR_REVIEW_DISMISSED = 'PR_REVIEW_DISMISSED',
  PR_REVIEW_THREAD_RESOLVED = 'PR_REVIEW_THREAD_RESOLVED',
  PR_REVIEW_THREAD_UNRESOLVED = 'PR_REVIEW_THREAD_UNRESOLVED',
  PR_REVIEW_COMMENT_CREATED = 'PR_REVIEW_COMMENT_CREATED',
  PR_REVIEW_COMMENT_UPDATED = 'PR_REVIEW_COMMENT_UPDATED',
}
