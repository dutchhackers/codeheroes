import { ActivityCounters } from './activity';
import { GameActionType } from '@codeheroes/shared/types';

export interface TimeBasedActivityStats {
  timeframeId: string;
  counters: ActivityCounters;
  xpGained: number;
  countersLastUpdated: string;
  lastActivity?: {
    type: GameActionType;
    timestamp: string;
  };
}

export interface TimePeriodStats {
  daily: TimeBasedActivityStats[];
  weekly: TimeBasedActivityStats[];
}

export interface TimeBasedStatsQuery {
  startDate?: string;
  endDate?: string;
  limit?: number;
}
