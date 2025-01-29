import { ActivityType } from '../../activity/activity.model';
import { BaseDocument } from '../../core/models/common.model';
import { PR_XP_SETTINGS } from '../activities/pull-request/pr-xp-settings';
import { PUSH_XP_SETTINGS } from '../activities/push/push-xp-settings';
import { ISSUE_XP_SETTINGS } from '../activities/issue/issue-xp-settings';

// Add interface for activity settings if not exists
export interface ActivitySettings {
  base: number;
  bonuses?: {
    [key: string]: BonusConfig;
  };
}

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
  // Push activities
  [ActivityType.CODE_PUSH]: PUSH_XP_SETTINGS,

  // Pull Request activities
  [ActivityType.PR_CREATED]: PR_XP_SETTINGS.created,
  [ActivityType.PR_UPDATED]: PR_XP_SETTINGS.updated,
  [ActivityType.PR_MERGED]: PR_XP_SETTINGS.merged,

  // Issue activities
  [ActivityType.ISSUE_CREATED]: ISSUE_XP_SETTINGS[ActivityType.ISSUE_CREATED],
  [ActivityType.ISSUE_CLOSED]: ISSUE_XP_SETTINGS[ActivityType.ISSUE_CLOSED],
  [ActivityType.ISSUE_UPDATED]: ISSUE_XP_SETTINGS[ActivityType.ISSUE_UPDATED],
  [ActivityType.ISSUE_REOPENED]: ISSUE_XP_SETTINGS[ActivityType.ISSUE_REOPENED],

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
      },
    },
  },
  [ActivityType.PR_REVIEW_UPDATED]: {
    base: 15,
    bonuses: {
      quickUpdate: {
        timeThreshold: '1h',
        xp: 10,
        description: 'Bonus for quick review update',
      },
    },
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
        description: 'Bonus for quick thread resolution',
      },
    },
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
        description: 'Bonus for detailed comment',
      },
      inThread: {
        xp: 10,
        description: 'Bonus for participating in discussion thread',
      },
    },
  },
  [ActivityType.PR_REVIEW_COMMENT_UPDATED]: {
    base: 10,
    bonuses: {
      significant: {
        threshold: 50, // characters added
        xp: 5,
        description: 'Bonus for significant comment update',
      },
    },
  },
  [ActivityType.CODE_COMMENT]: {
    base: 15,
    bonuses: {
      detailed: {
        threshold: 100, // characters
        xp: 10,
        description: 'Bonus for detailed code comment',
      },
    },
  },
} as const;
