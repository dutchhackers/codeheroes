export * from './activity.types';
export * from './activity.interfaces';
export * from './dto.types';

export enum ActivityCategory {
  CODE = 'CODE',
  PULL_REQUEST = 'PULL_REQUEST',
  ISSUE = 'ISSUE',
  REVIEW = 'REVIEW',
  DEPLOYMENT = 'DEPLOYMENT',
}

export enum ActivityType {
  // Code activities
  CODE_PUSH = 'CODE_PUSH',
  CODE_COVERAGE = 'CODE_COVERAGE',
  BRANCH_DELETED = 'BRANCH_DELETED',
  TAG_DELETED = 'TAG_DELETED',

  // Pull request activities
  PR_CREATED = 'PR_CREATED',
  PR_UPDATED = 'PR_UPDATED',
  PR_MERGED = 'PR_MERGED',

  // Issue activities
  ISSUE_CREATED = 'ISSUE_CREATED',
  ISSUE_CLOSED = 'ISSUE_CLOSED',
  ISSUE_UPDATED = 'ISSUE_UPDATED',
  ISSUE_REOPENED = 'ISSUE_REOPENED',

  // Review activities
  PR_REVIEW = 'PR_REVIEW',
  PR_REVIEW_SUBMITTED = 'PR_REVIEW_SUBMITTED',
  PR_REVIEW_UPDATED = 'PR_REVIEW_UPDATED',
  PR_REVIEW_DISMISSED = 'PR_REVIEW_DISMISSED',
  PR_REVIEW_THREAD_RESOLVED = 'PR_REVIEW_THREAD_RESOLVED',
  PR_REVIEW_THREAD_UNRESOLVED = 'PR_REVIEW_THREAD_UNRESOLVED',
  PR_REVIEW_COMMENT_CREATED = 'PR_REVIEW_COMMENT_CREATED',
  PR_REVIEW_COMMENT_UPDATED = 'PR_REVIEW_COMMENT_UPDATED',

  // Deployment activities
  DEPLOYMENT = 'DEPLOYMENT',
}

export const ActivityTypeToCategory: Record<ActivityType, ActivityCategory> = {
  [ActivityType.CODE_PUSH]: ActivityCategory.CODE,
  [ActivityType.CODE_COVERAGE]: ActivityCategory.CODE,
  [ActivityType.BRANCH_DELETED]: ActivityCategory.CODE,
  [ActivityType.TAG_DELETED]: ActivityCategory.CODE,

  [ActivityType.PR_CREATED]: ActivityCategory.PULL_REQUEST,
  [ActivityType.PR_UPDATED]: ActivityCategory.PULL_REQUEST,
  [ActivityType.PR_MERGED]: ActivityCategory.PULL_REQUEST,

  [ActivityType.ISSUE_CREATED]: ActivityCategory.ISSUE,
  [ActivityType.ISSUE_CLOSED]: ActivityCategory.ISSUE,
  [ActivityType.ISSUE_UPDATED]: ActivityCategory.ISSUE,
  [ActivityType.ISSUE_REOPENED]: ActivityCategory.ISSUE,

  [ActivityType.PR_REVIEW]: ActivityCategory.REVIEW,
  [ActivityType.PR_REVIEW_SUBMITTED]: ActivityCategory.REVIEW,
  [ActivityType.PR_REVIEW_UPDATED]: ActivityCategory.REVIEW,
  [ActivityType.PR_REVIEW_DISMISSED]: ActivityCategory.REVIEW,
  [ActivityType.PR_REVIEW_THREAD_RESOLVED]: ActivityCategory.REVIEW,
  [ActivityType.PR_REVIEW_THREAD_UNRESOLVED]: ActivityCategory.REVIEW,
  [ActivityType.PR_REVIEW_COMMENT_CREATED]: ActivityCategory.REVIEW,
  [ActivityType.PR_REVIEW_COMMENT_UPDATED]: ActivityCategory.REVIEW,

  [ActivityType.DEPLOYMENT]: ActivityCategory.DEPLOYMENT,
};
