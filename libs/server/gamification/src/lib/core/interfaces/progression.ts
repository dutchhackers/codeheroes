import { StreakType } from './streak';

export interface ProgressionState {
  userId: string;
  xp: number;
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  streaks: Record<StreakType, number>;
  lastActivityDate?: string;
}

export interface ProgressionUpdate {
  xpGained: number;
  newLevel?: number;
  achievements?: string[];
  streakUpdates?: Record<StreakType, number>;
  activityType?: string;
}

export interface LeaderboardEntry {
  userId: string;
  xp: number;
  level: number;
  rank?: number;
}
