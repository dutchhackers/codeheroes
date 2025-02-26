import {
  GameActionContext,
  GameActionMetrics,
  GameActionType,
  ActivityCounters,
  ActivityStats,
} from '@codeheroes/shared/types';

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

// ActivityCounters and ActivityStats have been moved to @codeheroes/shared/types
