export interface UserStats {
  // Basic stats
  xp: number;
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  lastActivityDate: string | null; // "YYYY-MM-DD"

  // Activity counters
  counters: {
    pullRequests: {
      created: number;
      merged: number;
      closed: number;
      total: number;
    };
    codePushes: number;
    codeReviews: number;
  };

  // // Streaks and time-based metrics
  // streaks: {
  //   current: number;
  //   longest: number;
  //   lastActiveDate: string | null;
  // };

  // // Achievements and badges summary
  // achievements: {
  //   total: number;
  //   lastEarned: string | null;
  // };
  // badges: {
  //   total: number;
  //   lastEarned: string | null;
  // };

  // // Repository metrics
  // repositories: {
  //   active: number;
  //   contributed: number;
  //   owned: number;
  // };

  // // Code metrics
  // codeMetrics: {
  //   totalLinesAdded: number;
  //   totalLinesRemoved: number;
  //   totalCommits: number;
  //   averageCommitSize: number;
  // };

  // // Review metrics
  // reviewMetrics: {
  //   totalReviews: number;
  //   averageCommentsPerReview: number;
  //   resolvedThreads: number;
  // };

  // Update tracking
  countersLastUpdated: string; // ISO date string
  lastUpdated: string; // ISO date string
}
