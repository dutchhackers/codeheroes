import { GameActionType } from '../game/action.types';
import { GameActionContext } from '../game/context.types';
import { GameActionMetrics } from '../game/metrics.types';

export interface ActivityCounters {
  // Single consistent approach for all action types
  actions: {
    [key in GameActionType]?: number;
  };
}

export interface ActivityStats {
  counters: ActivityCounters;
  countersLastUpdated: string;
  lastActivity?: {
    type: GameActionType;
    timestamp: string;
  };
}

export interface Activity {
  id: string;
  userId: string;
  // Instead of using GameActionType directly, we'll use a const that indicates
  // this is a game action record, while storing the actual type in sourceActionType
  type: 'game-action';
  sourceActionType: GameActionType; // Store the original action type

  // Context and metrics from GameAction
  context: GameActionContext;
  metrics: GameActionMetrics;

  // XP information earned from this activity
  xp: {
    earned: number;
    breakdown: Array<{
      type: string;
      amount: number;
      description: string;
    }>;
  };
  userFacingDescription: string;
  createdAt: string;
  updatedAt: string;
  eventId: string; // Add this property
  provider: string; // Make sure this exists too
  processingResult?: any;
}
