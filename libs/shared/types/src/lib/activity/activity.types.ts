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

export interface Activity {
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

export interface ActivityNotInUse {
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
