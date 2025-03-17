import { Activity } from '../activity/activity.types';
import { ProgressionState } from './progression.types';

export enum ProgressionEventType {
  XP_GAINED = 'progression.xp.gained',
  LEVEL_UP = 'progression.level.up',
  BADGE_EARNED = 'progression.badge.earned',
  ACTIVITY_RECORDED = 'progression.activity.recorded',
  ACHIEVEMENT_UNLOCKED = 'progression.achievement.unlocked',
}

export interface ProgressionEvent {
  userId: string;
  timestamp: string;
  type: ProgressionEventType;
  data: {
    activity?: Activity;
    state?: Partial<ProgressionState>;
    previousState?: Partial<ProgressionState>;
    badgeId?: string;
    // New (after recent refactoring)
    xpGained?: number;
    previousLevel?: number;
    newLevel?: number;
    achievementId?: string;
  };
}
