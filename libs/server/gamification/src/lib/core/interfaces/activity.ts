import { GameActionType } from '@codeheroes/shared/types';

export interface Activity {
  id: string;
  userId: string;
  type: GameActionType;
  metadata: Record<string, any>;
  xp: {
    earned: number;
    breakdown: Array<{
      type: string;
      amount: number;
      description: string;
    }>;
  };
  timestamp: string;
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
