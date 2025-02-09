import { ActivityType } from '@codeheroes/activity';
import { BaseDocument } from '@codeheroes/common';
import { ISSUE_XP_SETTINGS } from '../activities/issue/issue-xp-settings';
import { PR_REVIEW_XP_SETTINGS } from '../activities/pr-review/pr-review-xp-settings';
import { PR_XP_SETTINGS } from '../activities/pull-request/pr-xp-settings';
import { PUSH_XP_SETTINGS } from '../activities/push/push-xp-settings';
import { DELETE_XP_SETTINGS } from '../activities/delete/delete-xp-settings';

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
  currentLevelXp: number;
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
  // Push activities
  [ActivityType.CODE_PUSH]: PUSH_XP_SETTINGS,
  [ActivityType.BRANCH_DELETED]: DELETE_XP_SETTINGS,

  // Pull Request activities
  [ActivityType.PR_CREATED]: PR_XP_SETTINGS.created,
  [ActivityType.PR_UPDATED]: PR_XP_SETTINGS.updated,
  [ActivityType.PR_MERGED]: PR_XP_SETTINGS.merged,

  // Issue activities
  [ActivityType.ISSUE_CREATED]: ISSUE_XP_SETTINGS[ActivityType.ISSUE_CREATED],
  [ActivityType.ISSUE_CLOSED]: ISSUE_XP_SETTINGS[ActivityType.ISSUE_CLOSED],
  [ActivityType.ISSUE_UPDATED]: ISSUE_XP_SETTINGS[ActivityType.ISSUE_UPDATED],
  [ActivityType.ISSUE_REOPENED]: ISSUE_XP_SETTINGS[ActivityType.ISSUE_REOPENED],

  // PR Review activities
  [ActivityType.PR_REVIEW_SUBMITTED]: PR_REVIEW_XP_SETTINGS[ActivityType.PR_REVIEW_SUBMITTED],
  [ActivityType.PR_REVIEW_UPDATED]: PR_REVIEW_XP_SETTINGS[ActivityType.PR_REVIEW_UPDATED],
  [ActivityType.PR_REVIEW_DISMISSED]: PR_REVIEW_XP_SETTINGS[ActivityType.PR_REVIEW_DISMISSED],
  [ActivityType.PR_REVIEW_THREAD_RESOLVED]: PR_REVIEW_XP_SETTINGS[ActivityType.PR_REVIEW_THREAD_RESOLVED],
  [ActivityType.PR_REVIEW_THREAD_UNRESOLVED]: PR_REVIEW_XP_SETTINGS[ActivityType.PR_REVIEW_THREAD_UNRESOLVED],
  [ActivityType.PR_REVIEW_COMMENT_CREATED]: PR_REVIEW_XP_SETTINGS[ActivityType.PR_REVIEW_COMMENT_CREATED],
  [ActivityType.PR_REVIEW_COMMENT_UPDATED]: PR_REVIEW_XP_SETTINGS[ActivityType.PR_REVIEW_COMMENT_UPDATED],
} as const;
