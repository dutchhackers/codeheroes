import { GameActionType } from '../game/action.types';
import { GameActionContext } from '../game/context.types';
import { GameActionMetrics } from '../game/metrics.types';

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

export interface ActivityStats {
  counters: ActivityCounters;
  countersLastUpdated: string;
  lastActivity?: {
    type: GameActionType;
    timestamp: string;
  };
}

export enum ActivityType {
  CODE_PUSH = 'CODE_PUSH',
  PR_CREATED = 'PR_CREATED',
  PR_MERGED = 'PR_MERGED',
  PR_REVIEWED = 'PR_REVIEWED',
  ISSUE_CREATED = 'ISSUE_CREATED',
  ISSUE_CLOSED = 'ISSUE_CLOSED',
  REVIEW_COMMENT = 'REVIEW_COMMENT',
  CODE_REVIEW = 'CODE_REVIEW',
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

// Legacy Activity interface (consider deprecating)
export interface ActivityLegacy {
  id: string;
  userId: string;
  type: ActivityType;
  timestamp: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  data: {
    repository: {
      id: string;
      name: string;
      owner: string;
    };
    metrics?: {
      linesAdded?: number;
      linesRemoved?: number;
      filesChanged?: number;
      commits?: number;
    };
    metadata: Record<string, unknown>;
  };
  xp: {
    earned: number;
    breakdown: Array<{
      type: string;
      amount: number;
      reason: string;
    }>;
  };
}

// New improved Activity interface with UI-friendly data
export interface Activity {
  id: string;
  userId: string;
  type: GameActionType;

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
