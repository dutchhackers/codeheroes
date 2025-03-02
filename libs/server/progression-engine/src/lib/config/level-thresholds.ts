import { LEVEL_DEFINITION } from './level-definitions.config';

export function calculateXpForLevel(level: number): number {
  const config = LEVEL_DEFINITION.find((c) => c.level === level);
  return config?.xpRequired ?? 0;
}

export function getLevelFromXp(totalXp: number): number {
  const level = LEVEL_DEFINITION.findIndex(
    (config, index, array) =>
      totalXp >= config.xpRequired && (index === array.length - 1 || totalXp < array[index + 1].xpRequired),
  );
  return level === -1 ? 1 : LEVEL_DEFINITION[level].level;
}

export function getXpProgress(totalXp: number): {
  currentLevel: number;
  currentLevelXp: number;
  xpToNextLevel: number;
} {
  const currentLevelConfig = LEVEL_DEFINITION.find(
    (config, index, array) =>
      totalXp >= config.xpRequired && (index === array.length - 1 || totalXp < array[index + 1].xpRequired),
  );

  if (!currentLevelConfig) {
    return {
      currentLevel: 1,
      currentLevelXp: 0,
      xpToNextLevel: LEVEL_DEFINITION[1].xpRequired,
    };
  }

  const nextLevelConfig = LEVEL_DEFINITION.find((config) => config.level === currentLevelConfig.level + 1);

  return {
    currentLevel: currentLevelConfig.level,
    currentLevelXp: totalXp - currentLevelConfig.xpRequired,
    xpToNextLevel: nextLevelConfig ? nextLevelConfig.xpRequired - totalXp : 0,
  };
}

export function getLevelRequirements(level: number) {
  return LEVEL_DEFINITION.find((config) => config.level === level);
}

export function getNextLevelRequirements(level: number) {
  return LEVEL_DEFINITION.find((config) => config.level === level + 1);
}
