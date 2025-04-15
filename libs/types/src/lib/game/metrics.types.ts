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

export type GameActionMetrics =
  | CodeMetrics
  | PullRequestMetrics
  | CodeReviewMetrics
  | IssueMetrics
  | WorkoutMetrics
  | CodePushMetrics
  | ManualMetrics;
