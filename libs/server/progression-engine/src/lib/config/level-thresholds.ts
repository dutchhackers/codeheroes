import { LEVEL_DEFINITIONS } from './level-definitions.config';

export function calculateXpForLevel(level: number): number {
  const config = LEVEL_DEFINITIONS.find((c) => c.level === level);
  return config?.xpRequired ?? 0;
}

export function getLevelFromXp(totalXp: number): number {
  const level = LEVEL_DEFINITIONS.findIndex(
    (config, index, array) =>
      totalXp >= config.xpRequired && (index === array.length - 1 || totalXp < array[index + 1].xpRequired),
  );
  return level === -1 ? 1 : LEVEL_DEFINITIONS[level].level;
}

export function getXpProgress(totalXp: number): {
  currentLevel: number;
  currentLevelXp: number;
  xpToNextLevel: number;
} {
  const currentLevelConfig = LEVEL_DEFINITIONS.find(
    (config, index, array) =>
      totalXp >= config.xpRequired && (index === array.length - 1 || totalXp < array[index + 1].xpRequired),
  );

  if (!currentLevelConfig) {
    return {
      currentLevel: 1,
      currentLevelXp: 0,
      xpToNextLevel: LEVEL_DEFINITIONS[1].xpRequired,
    };
  }

  const nextLevelConfig = LEVEL_DEFINITIONS.find((config) => config.level === currentLevelConfig.level + 1);

  return {
    currentLevel: currentLevelConfig.level,
    currentLevelXp: totalXp - currentLevelConfig.xpRequired,
    xpToNextLevel: nextLevelConfig ? nextLevelConfig.xpRequired - totalXp : 0,
  };
}

export function getLevelRequirements(level: number) {
  return LEVEL_DEFINITIONS.find((config) => config.level === level);
}

export function getNextLevelRequirements(level: number) {
  return LEVEL_DEFINITIONS.find((config) => config.level === level + 1);
}
