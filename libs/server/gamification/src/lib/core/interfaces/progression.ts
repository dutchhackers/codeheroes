import { StreakType } from './streak';

export interface ProgressionState {
  userId: string;
  xp: number;
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  streaks: Record<StreakType, number>;
  achievements?: string[];
  lastActivityDate?: string;
}

export interface ProgressionUpdate {
  xpGained: number;
  newLevel?: number;
  achievements?: string[];
  streakUpdates?: Record<StreakType, number>;
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

export interface LeaderboardEntry {
  userId: string;
  xp: number;
  level: number;
  rank?: number;
}
