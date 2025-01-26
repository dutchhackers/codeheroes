import { BaseDocument } from '../core/models/common.model';

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
  currentLevelXp: number;  // Add this line
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
    base: 10,
    bonuses: {
      multipleCommits: {
        threshold: 1,
        xp: 5,
        description: 'Bonus for multiple commits in push',
      },
    },
  },
  PR_CREATED: {
    base: 20,
  },
  PR_UPDATED: {
    base: 5, // Base XP for updating PR
    bonuses: {
      multipleFiles: {
        threshold: 5,
        xp: 5,
        description: 'Bonus for updating multiple files',
      },
      significantChanges: {
        threshold: 50,
        xp: 5,
        description: 'Bonus for significant code changes',
      },
      quickUpdate: {
        timeThreshold: '1h',
        xp: 5,
        description: 'Bonus for quick PR iteration',
      },
    },
  },
  PR_MERGED: {
    base: 30,
    bonuses: {
      merged: {
        xp: 20,
        description: 'Bonus for merging pull request',
      },
    },
  },
  ISSUE_CREATED: {
    base: 15,
  },
  ISSUE_CLOSED: {
    base: 20,
    bonuses: {
      completed: {
        xp: 5,
        description: 'Bonus for completing issue',
      },
    },
  },
  ISSUE_UPDATED: {
    base: 5,
  },
  ISSUE_REOPENED: {
    base: 5,
  },
};
