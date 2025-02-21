import { LEVEL_CONFIGURATION } from './level-configuration';
import { LevelRequirementItem } from '../core/interfaces/level';

export function calculateXpForLevel(level: number): number {
  const config = LEVEL_CONFIGURATION.find((c) => c.level === level);
  return config?.xpRequired ?? 0;
}

export function getLevelFromXp(totalXp: number): number {
  const level = LEVEL_CONFIGURATION.findIndex(
    (config, index, array) =>
      totalXp >= config.xpRequired && (index === array.length - 1 || totalXp < array[index + 1].xpRequired),
  );
  return level === -1 ? 0 : LEVEL_CONFIGURATION[level].level;
}

export function getXpProgress(totalXp: number): {
  currentLevel: number;
  currentLevelXp: number;
  xpToNextLevel: number;
} {
  const currentLevelConfig = LEVEL_CONFIGURATION.find(
    (config, index, array) =>
      totalXp >= config.xpRequired && (index === array.length - 1 || totalXp < array[index + 1].xpRequired),
  );

  if (!currentLevelConfig) {
    return {
      currentLevel: 0,
      currentLevelXp: 0,
      xpToNextLevel: LEVEL_CONFIGURATION[1].xpRequired,
    };
  }

  const nextLevelConfig = LEVEL_CONFIGURATION.find((config) => config.level === currentLevelConfig.level + 1);

  return {
    currentLevel: currentLevelConfig.level,
    currentLevelXp: totalXp - currentLevelConfig.xpRequired,
    xpToNextLevel: nextLevelConfig ? nextLevelConfig.xpRequired - totalXp : 0,
  };
}

export function getLevelRequirements(level: number) {
  return LEVEL_CONFIGURATION.find((config) => config.level === level);
}

export function getNextLevelRequirements(level: number) {
  return LEVEL_CONFIGURATION.find((config) => config.level === level + 1);
}
