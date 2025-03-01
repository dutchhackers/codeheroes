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

// For UI display purposes - more specific than GameActionType
export enum ActivityIconType {
  PUSH = 'push',
  PR_CREATE = 'pr-create',
  PR_MERGE = 'pr-merge',
  PR_CLOSE = 'pr-close',
  REVIEW = 'review',
  ISSUE = 'issue',
  ISSUE_OPEN = 'issue-open',
  ISSUE_CLOSE = 'issue-close',
  COMMIT = 'commit',
  CODE = 'code',
  WORKOUT = 'workout',
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

  // UI display metadata - these fields make the Activity usable directly in UI
  display: {
    title: string; // e.g., "Pushed 3 commits to main" or "Merged PR: Add user settings"
    description: string; // More detailed info or commit message excerpt
    url?: string; // Link to the actual item (PR, commit, etc.)
    iconType: ActivityIconType | GameActionType; // For UI to show appropriate icon
    additionalInfo?: {
      repositoryName?: string; // Repository name for display - moved from root level
      repositoryOwner?: string; // Repository owner for display - moved from root level
      [key: string]: any;
    };
  };

  // XP information earned from this activity
  xp: {
    earned: number;
    breakdown: Array<{
      type: string;
      amount: number;
      description: string;
    }>;
  };

  // Metadata like level at time of activity, bonuses applied
  metadata?: {
    level?: number;
    bonuses?: Record<string, number>;
    [key: string]: any;
  };

  createdAt: string;
  updatedAt: string;
}
