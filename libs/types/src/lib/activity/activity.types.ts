import { GameActionType } from '../game/action.types';
import { GameActionContext } from '../game/context.types';
import { GameActionMetrics } from '../game/metrics.types';
import { BadgeRarity } from '../gamification/badges.types';

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

// ============================================================================
// Activity Types - Discriminated Union
// ============================================================================

/**
 * Base fields shared by all activity types
 */
interface BaseActivity {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  eventId: string;
  provider: string;
  userFacingDescription: string;
}

/**
 * Activity created from a game action (push, PR, review, etc.)
 */
export interface GameActionActivity extends BaseActivity {
  type: 'game-action';
  sourceActionType: GameActionType;
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
  processingResult?: unknown;
}

/**
 * Activity created when a user earns a badge
 */
export interface BadgeEarnedActivity extends BaseActivity {
  type: 'badge-earned';
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: BadgeRarity;
    category: string;
  };
  trigger?: {
    type: 'level-up' | 'milestone' | 'special';
    level?: number;
    activityType?: string;
    count?: number;
  };
}

/**
 * Activity created when a user levels up
 */
export interface LevelUpActivity extends BaseActivity {
  type: 'level-up';
  level: {
    previous: number;
    new: number;
  };
  xp: {
    total: number;
    toNextLevel: number;
  };
}

/**
 * Union type for all activity types
 */
export type Activity = GameActionActivity | BadgeEarnedActivity | LevelUpActivity;

/**
 * Type for activity types (for use in switch statements)
 */
export type ActivityType = Activity['type'];

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if an activity is a game action activity
 */
export function isGameActionActivity(activity: Activity): activity is GameActionActivity {
  return activity.type === 'game-action';
}

/**
 * Check if an activity is a badge earned activity
 */
export function isBadgeEarnedActivity(activity: Activity): activity is BadgeEarnedActivity {
  return activity.type === 'badge-earned';
}

/**
 * Check if an activity is a level up activity
 */
export function isLevelUpActivity(activity: Activity): activity is LevelUpActivity {
  return activity.type === 'level-up';
}
