import { GameActionType } from '../game/action.types';

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
