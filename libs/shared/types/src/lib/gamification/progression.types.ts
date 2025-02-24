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
