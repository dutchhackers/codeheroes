import { BaseDocument } from '../../core/models/common.model';
import { ActivityType } from '../../activity/activity.model';

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

export type GameXpSettings = Partial<Record<ActivityType, XpSettings>>;

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

// Type-safe XP settings using ActivityType enum
export const DEFAULT_XP_SETTINGS: GameXpSettings = {
  [ActivityType.CODE_PUSH]: {
    base: 25,
    bonuses: {
      multipleCommits: {
        threshold: 2,
        xp: 15,
        description: 'Bonus for multiple commits in push',
      },
    },
  },
  [ActivityType.PR_CREATED]: {
    base: 50,
    bonuses: {
      readyForReview: {
        xp: 15,
        description: 'Bonus for marking PR as ready for review',
      },
    },
  },
  [ActivityType.PR_UPDATED]: {
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
  [ActivityType.PR_MERGED]: {
    base: 75,
    bonuses: {
      merged: {
        xp: 50,
        description: 'Bonus for merging pull request',
      },
    },
  },
  [ActivityType.ISSUE_CREATED]: {
    base: 30,
  },
  [ActivityType.ISSUE_CLOSED]: {
    base: 40,
    bonuses: {
      completed: {
        xp: 20,
        description: 'Bonus for completing issue',
      },
    },
  },
  [ActivityType.ISSUE_UPDATED]: {
    base: 10,
  },
  [ActivityType.ISSUE_REOPENED]: {
    base: 5,
  },
  [ActivityType.PR_REVIEW_SUBMITTED]: {
    base: 40,
    bonuses: {
      approved: {
        xp: 20,
        description: 'Bonus for approving PR',
      },
      changesRequested: {
        xp: 30,
        description: 'Bonus for detailed review with change requests',
      }
    }
  },
  [ActivityType.PR_REVIEW_UPDATED]: {
    base: 15,
    bonuses: {
      quickUpdate: {
        timeThreshold: '1h',
        xp: 10,
        description: 'Bonus for quick review update'
      }
    }
  },
  [ActivityType.PR_REVIEW_DISMISSED]: {
    base: 10,
  },
  [ActivityType.PR_REVIEW_THREAD_RESOLVED]: {
    base: 25,
    bonuses: {
      quickResolution: {
        timeThreshold: '4h',
        xp: 15,
        description: 'Bonus for quick thread resolution'
      }
    }
  },
  [ActivityType.PR_REVIEW_THREAD_UNRESOLVED]: {
    base: 10,
  },
  [ActivityType.PR_REVIEW_COMMENT_CREATED]: {
    base: 20,
    bonuses: {
      detailed: {
        threshold: 100, // characters
        xp: 15,
        description: 'Bonus for detailed comment'
      },
      inThread: {
        xp: 10,
        description: 'Bonus for participating in discussion thread'
      }
    }
  },
  [ActivityType.PR_REVIEW_COMMENT_UPDATED]: {
    base: 10,
    bonuses: {
      significant: {
        threshold: 50, // characters added
        xp: 5,
        description: 'Bonus for significant comment update'
      }
    }
  },
  [ActivityType.CODE_COMMENT]: {
    base: 15,
    bonuses: {
      detailed: {
        threshold: 100, // characters
        xp: 10,
        description: 'Bonus for detailed code comment'
      }
    }
  }
} as const;
