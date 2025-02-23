import { LEVEL_CONFIGURATION, LevelConfig } from '../../constants/level-configuration';
import {
  calculateXpForLevel,
  getLevelFromXp,
  getXpProgress,
  getLevelRequirements,
  getNextLevelRequirements,
} from '../../constants/level-thresholds';

// Re-export level calculation functions
export {
  calculateXpForLevel,
  getLevelFromXp as calculateLevel,
  getXpProgress,
  getLevelRequirements,
  getNextLevelRequirements,
};

export function calculateXpToNextLevel(totalXp: number): number {
  const { xpToNextLevel } = getXpProgress(totalXp);
  return xpToNextLevel;
}

export function calculateLevelProgress(totalXp: number): number {
  const { currentLevelXp, xpToNextLevel } = getXpProgress(totalXp);
  return xpToNextLevel > 0 ? Math.min(100, (currentLevelXp / xpToNextLevel) * 100) : 100;
}

export function getLevelRewards(level: number): LevelConfig['rewards'] | undefined {
  const config = getLevelRequirements(level);
  return config?.rewards;
}
