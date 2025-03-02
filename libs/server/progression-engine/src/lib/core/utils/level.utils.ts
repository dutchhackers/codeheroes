import { LevelDefinition } from '../../constants/level-definitions.config';
import {
  calculateXpForLevel,
  getLevelFromXp,
  getLevelRequirements,
  getNextLevelRequirements,
  getXpProgress,
} from '../../constants/level-thresholds';

// Re-export level calculation functions
export {
  getLevelFromXp as calculateLevel,
  calculateXpForLevel,
  getLevelRequirements,
  getNextLevelRequirements,
  getXpProgress,
};

export function calculateXpToNextLevel(totalXp: number): number {
  const { xpToNextLevel } = getXpProgress(totalXp);
  return xpToNextLevel;
}

export function calculateLevelProgress(totalXp: number): number {
  const { currentLevelXp, xpToNextLevel } = getXpProgress(totalXp);
  return xpToNextLevel > 0 ? Math.min(100, (currentLevelXp / xpToNextLevel) * 100) : 100;
}

export function getLevelRewards(level: number): LevelDefinition['rewards'] | undefined {
  const config = getLevelRequirements(level);
  return config?.rewards;
}
