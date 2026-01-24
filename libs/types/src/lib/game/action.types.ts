import { ConnectedAccountProvider } from '../core/providers';
import { GameActionContext } from './context.types';
import { GameActionMetrics } from './metrics.types';

/**
 * Represents the result of processing a game action
 */
// Update libs/types/src/lib/game/action.types.ts
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

  /**
   * Whether the user leveled up as a result of this action
   */
  leveledUp?: boolean; // Add this line
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
  // Comment actions
  | 'comment_create'
  | 'review_comment_create'
  // Release actions
  | 'release_publish'
  // CI/CD actions
  | 'ci_success'
  // Discussion actions
  | 'discussion_create'
  | 'discussion_comment'
  // Workout actions
  | 'workout_complete'
  | 'distance_milestone'
  | 'speed_record'
  // Manual actions
  | 'manual_update';

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
