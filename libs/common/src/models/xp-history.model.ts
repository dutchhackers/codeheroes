import { BaseDocument } from './common.model';

export interface XpHistoryEntry extends BaseDocument {
  xpChange: number;
  newXp: number;
  newLevel: number;
  activityId: string;
  activityType: string;
  breakdown: {
    description: string;
    xp: number;
  }[];
}

export interface LevelCalculationResult {
  level: number;
  xpToNextLevel: number;
}
