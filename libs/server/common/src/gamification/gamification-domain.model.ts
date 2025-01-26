import { BaseDocument } from '../core/models/common.model';

export interface XpBreakdownItem {
  description: string;
  xp: number;
}

export interface XpSettings {
  base: number;
  bonuses?: {
    [key: string]: number;
  };
}

export interface GameXpSettings {
  [key: string]: XpSettings;
}

export interface XpCalculationResponse {
  totalXp: number;
  breakdown: XpBreakdownItem[];
}

export interface XpHistoryEntry extends BaseDocument {
  xpChange: number;
  newXp: number;
  newLevel: number;
  activityId: string;
  activityType: string;
  breakdown: XpBreakdownItem[];
}

export interface LevelCalculationResult {
  level: number;
  xpToNextLevel: number;
}

export interface UserXpData {
  xp: number;
  level: number;
  xpToNextLevel: number;
}

export interface ActivityXpResult {
  processed: boolean;
  awarded: number;
  breakdown: XpBreakdownItem[];
}

export interface BadgeReward {
  id: string;
  name: string;
  description: string;
  achievedAt: string;
}

export interface AchievementReward {
  id: string;
  name: string;
  description: string;
  progress: number;
  completed: boolean;
  completedAt?: string;
}

export interface XpReward {
  processed: boolean;
  awarded: number;
  breakdown: XpBreakdownItem[];
}

export interface ActivityProcessingResult {
  processed: boolean;
  processedAt: string;
  xp?: XpReward;
  badges?: BadgeReward[];
  achievements?: AchievementReward[];
}

export const DEFAULT_XP_SETTINGS: GameXpSettings = {
  CODE_PUSH: {
    base: 10,
    bonuses: {
      multipleCommits: 5,
    },
  },
  PR_CREATED: {
    base: 20,
  },
  PR_MERGED: {
    base: 30,
    bonuses: {
      merged: 20,
    },
  },
  ISSUE_CREATED: {
    base: 15,
  },
  ISSUE_CLOSED: {
    base: 20,
  },
  ISSUE_UPDATED: {
    base: 5,
  },
};
