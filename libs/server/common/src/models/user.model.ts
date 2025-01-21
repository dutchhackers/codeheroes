import { BaseDocument, ConnectedAccountProvider } from './common.model';
import { ActivityProcessingResult } from './gamification-domain.model';

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
  type: ActivityType;
  eventId: string; // In the future this might become an optional field
  userId: string;
  provider: ConnectedAccountProvider;
  eventType: string;
  externalEventId: string;
  externalEventTimestamp: string;
  userFacingDescription: string;
  metadata?: ActivityData;
  processingResult?: ActivityProcessingResult; // replaces xp field
}

export type CreateActivityInput = Omit<UserActivity, 'id' | 'createdAt' | 'updatedAt'>;

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
  PR_MERGED = 'PR_MERGED',
  PR_REVIEW = 'PR_REVIEW',
  ISSUE_CREATED = 'ISSUE_CREATED',
  ISSUE_CLOSED = 'ISSUE_CLOSED',
  CODE_COMMENT = 'CODE_COMMENT',

  // Additional (future) activities
  CODE_COVERAGE = 'CODE_COVERAGE',
  DEPLOYMENT = 'DEPLOYMENT',
}
