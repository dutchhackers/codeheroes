import { LevelDefinition } from '../../config/level-definitions.config';
import { getLevelRequirements, getXpProgress } from '../../config/level-thresholds';

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
