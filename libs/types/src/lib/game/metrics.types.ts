export interface BaseMetrics {
  type: string;
  timestamp: string;
}

export interface ManualMetrics extends BaseMetrics {
  type: 'manual';
}

export interface CodeMetrics extends BaseMetrics {
  type: 'code';
  commits?: number;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
  impactScore?: number; // calculated from changes
}

export interface PullRequestMetrics extends BaseMetrics {
  type: 'pull_request';
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  comments?: number;
  reviewers?: number;
  timeToMerge?: number; // in seconds
}

export interface CodeReviewMetrics extends BaseMetrics {
  type: 'code_review';
  commentsCount: number;
  threadCount: number;
  filesReviewed: number;
  linesReviewed?: number;
  suggestionsCount?: number;
  timeToReview: number; // in seconds
  thoroughness?: number; // calculated score
}

export interface IssueMetrics extends BaseMetrics {
  type: 'issue';
  bodyLength: number;
  linkedPRs?: number;
  assignees?: number;
  labels?: number;
  timeToClose?: number; // in seconds
  complexity?: number; // calculated from content
  updatedWithNewInfo?: boolean; // Indicates if reopened issue has new information
}

export interface WorkoutMetrics extends BaseMetrics {
  type: 'workout';
  distance: number; // in meters
  duration: number; // in seconds
  elevationGain?: number;
  averageSpeed?: number;
  maxSpeed?: number;
  effort?: number; // calculated score
}

export interface CodePushMetrics extends BaseMetrics {
  type: 'code_push';
  commitCount: number;
}

export interface CommentMetrics extends BaseMetrics {
  type: 'comment';
  bodyLength: number;
  isOnPullRequest: boolean;
}

export interface ReviewCommentMetrics extends BaseMetrics {
  type: 'review_comment';
  bodyLength: number;
  hasSuggestion: boolean; // Contains code suggestion (```suggestion block)
  isReply: boolean; // Is a reply to another comment
}

export interface ReleaseMetrics extends BaseMetrics {
  type: 'release';
  hasReleaseNotes: boolean; // Has release notes body
  isMajorVersion: boolean; // Semver major bump (e.g., v2.0.0)
  isMinorVersion: boolean; // Semver minor bump (e.g., v1.1.0)
  isPatchVersion: boolean; // Semver patch bump (e.g., v1.0.1)
  isPrerelease: boolean; // Is a prerelease version
}

export interface WorkflowRunMetrics extends BaseMetrics {
  type: 'workflow_run';
  conclusion: string; // success, failure, cancelled, etc.
  isDeployment: boolean; // Workflow name contains 'deploy'
}

export interface DiscussionMetrics extends BaseMetrics {
  type: 'discussion';
  bodyLength: number;
  isAnswerable: boolean; // Discussion category allows answers
  isAcceptedAnswer?: boolean; // For discussion_comment - is this the accepted answer
}

export type GameActionMetrics =
  | CodeMetrics
  | PullRequestMetrics
  | CodeReviewMetrics
  | IssueMetrics
  | CommentMetrics
  | ReviewCommentMetrics
  | ReleaseMetrics
  | WorkflowRunMetrics
  | DiscussionMetrics
  | WorkoutMetrics
  | CodePushMetrics
  | ManualMetrics;
