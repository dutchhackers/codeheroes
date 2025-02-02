export interface ActivityMetrics {
  [key: string]: number | undefined;
}

export interface PushActivityMetrics extends ActivityMetrics {
  commits: number;
}

export interface PullRequestActivityMetrics extends ActivityMetrics {
  commits: number;
  // additions: number;
  // deletions: number;
  // changedFiles: number;
  // timeInvested: number;
}

export interface CodeMetrics extends ActivityMetrics {
  commits: number;
  // additions: number;
  // deletions: number;
  // changedFiles: number;
}

export interface PullRequestMetrics extends ActivityMetrics {
  commits: number;
  // additions: number;
  // deletions: number;
  // changedFiles: number;
  // timeToMerge?: number;
  // timeToFirstReview?: number;
  // reviewCount: number;
  // commentCount: number;
}

export interface ReviewMetrics extends ActivityMetrics {
  none?: number;
  // commentCount: number;
  // threadCount: number;
  // timeToComplete: number;
  // linesReviewed: number;
}

