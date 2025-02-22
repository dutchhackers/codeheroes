import { ActivityStats } from './activity';

export interface ProgressionState {
  userId: string;
  xp: number;
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  achievements?: string[];
  lastActivityDate?: string;
  activityStats?: ActivityStats;
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
