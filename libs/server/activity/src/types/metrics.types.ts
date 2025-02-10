// Base metrics interface
export interface ActivityMetrics {
  [key: string]: number | undefined;
}

// Code activity metrics
export interface PushActivityMetrics extends ActivityMetrics {
  commits: number;
}

// Pull request metrics
export interface PullRequestActivityMetrics extends ActivityMetrics {
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
}

// Review metrics
export interface ReviewActivityMetrics extends ActivityMetrics {
  commentCount?: number;
  threadCount?: number;
  timeToComplete?: number;
  linesReviewed?: number;
}

// Thread metrics
export interface ReviewThreadActivityMetrics extends ActivityMetrics {
  commentCount: number;
  timeToResolve?: number;
}

// Issue metrics
export interface IssueActivityMetrics extends ActivityMetrics {
  commentCount?: number;
  timeToClose?: number;
  timeToFirstResponse?: number;
}
