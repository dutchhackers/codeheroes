import { GameActionContext, GameActionMetrics, GameActionType } from '@codeheroes/shared/types';

export interface Activity {
  id: string;
  userId: string;
  type: GameActionType;
  // Add context and metrics from GameAction
  context: GameActionContext;
  metrics: GameActionMetrics;
  xp: {
    earned: number;
    breakdown: Array<{
      type: string;
      amount: number;
      description: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ActivityCounters {
  pullRequests: {
    created: number;
    merged: number;
    closed: number;
    total: number;
  };
  codePushes: number;
  codeReviews: number;
}

// Simplified ActivityStats that only uses counters
export interface ActivityStats {
  counters: ActivityCounters;
  countersLastUpdated: string;
  lastActivity?: {
    type: GameActionType;
    timestamp: string;
  };
}
