import { BaseDocument } from '../../core/models/common.model';

export interface XpBreakdownItem {
  description: string;
  xp: number;
}

export interface BonusConfig {
  threshold?: number;
  timeThreshold?: string;
  xp: number;
  description: string;
}

export interface XpSettings {
  base: number;
  bonuses?: {
    [key: string]: BonusConfig;
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
  currentLevelXp: number; // Add this line
  activityId: string;
  activityType: string;
  breakdown: XpBreakdownItem[];
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
    base: 25,
    bonuses: {
      multipleCommits: {
        threshold: 2,
        xp: 15,
        description: 'Bonus for multiple commits in push',
      },
    },
  },
  PR_CREATED: {
    base: 50,
  },
  PR_UPDATED: {
    base: 15,
    bonuses: {
      multipleFiles: {
        threshold: 5,
        xp: 20,
        description: 'Bonus for updating multiple files',
      },
      significantChanges: {
        threshold: 100,
        xp: 25,
        description: 'Bonus for significant code changes',
      },
      quickUpdate: {
        timeThreshold: '1h',
        xp: 10,
        description: 'Bonus for quick PR iteration',
      },
    },
  },
  PR_MERGED: {
    base: 75,
    bonuses: {
      merged: {
        xp: 50,
        description: 'Bonus for merging pull request',
      },
    },
  },
  ISSUE_CREATED: {
    base: 30,
  },
  ISSUE_CLOSED: {
    base: 40,
    bonuses: {
      completed: {
        xp: 20,
        description: 'Bonus for completing issue',
      },
    },
  },
  ISSUE_UPDATED: {
    base: 10,
  },
  ISSUE_REOPENED: {
    base: 5,
  },
};
