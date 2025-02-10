export interface ActivityMetrics {
  [key: string]: number | undefined;
}

export interface PushActivityMetrics extends ActivityMetrics {
  commits: number;
}

export interface PullRequestActivityMetrics extends ActivityMetrics {
  commits: number;
}

export interface CodeMetrics extends ActivityMetrics {
  commits: number;
}

export interface PullRequestMetrics extends ActivityMetrics {
  commits: number;
}

export interface ReviewMetrics extends ActivityMetrics {
  none?: number;
  // commentCount: number;
  // threadCount: number;
  // timeToComplete: number;
  // linesReviewed: number;
}

