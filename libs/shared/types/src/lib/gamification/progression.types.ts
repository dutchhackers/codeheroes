import { ActivityCounters } from '../activity/activity.types';

export enum ProgressionEventType {
  XP_GAINED = 'xp.gained',
  LEVEL_UP = 'level.up',
  BADGE_EARNED = 'badge.earned',
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  STREAK_UPDATED = 'streak.updated',
}

export interface ProgressionEvent {
  type: ProgressionEventType;
  userId: string;
  timestamp: string;
  data: {
    xpGained?: number;
    newLevel?: number;
    badgeId?: string;
    achievementId?: string;
    streakDays?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface ProgressionState {
  userId: string;
  xp: number;
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  achievements?: string[];
  lastActivityDate?: string;
  counters: ActivityCounters;
  countersLastUpdated: string;
}

export interface ProgressionUpdate {
  xpGained: number;
  newLevel?: number;
  achievements?: string[];
  activityType?: string;
}

export interface LevelProgress {
  currentLevel: number;
  totalXp: number;
  currentLevelXp: number;
  xpForCurrentLevel: number;
  xpToNextLevel: number;
  progressPercentage: number;
}
