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
