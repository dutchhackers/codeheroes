import { ConnectedAccountProvider } from '../core/providers';
import { GameActionContext } from './context.types';
import { GameActionMetrics } from './metrics.types';

/**
 * Represents the result of processing a game action
 */
export interface ActionResult {
  /**
   * Amount of XP gained from the action
   */
  xpGained: number;

  /**
   * Any badges earned from the action
   */
  badgesEarned?: string[];

  /**
   * Any rewards granted as a result of the action
   */
  rewards?: Record<string, any>;

  /**
   * The user's level after the action is processed
   */
  level?: number;

  /**
   * Progress information for the user's current level
   */
  currentLevelProgress?: {
    level: number;
    currentLevelXp: number;
    xpToNextLevel: number;
  };
}

export type GameActionType =
  // Code actions
  | 'code_push'
  | 'pull_request_create'
  | 'pull_request_merge'
  | 'pull_request_close'
  | 'code_review_submit'
  | 'code_review_comment'
  // Issue actions
  | 'issue_create'
  | 'issue_close'
  | 'issue_reopen'
  // Workout actions
  | 'workout_complete'
  | 'distance_milestone'
  | 'speed_record';

export interface GameAction {
  id: string;
  userId: string;
  externalId: string;
  provider: ConnectedAccountProvider;
  type: GameActionType;
  timestamp: string;

  externalUser: {
    id: string;
    username: string;
  };

  // Context identifies the "where"
  context: GameActionContext;

  // Metrics measure the "how much/well"
  metrics?: GameActionMetrics;

  status: 'pending' | 'processed' | 'failed';
  processedAt?: string;
  error?: string;

  createdAt: string;
  updatedAt: string;
}
