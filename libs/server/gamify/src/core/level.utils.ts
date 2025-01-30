import { LEVEL_CONFIGURATION, LevelRequirement } from './../models/level.model';

export interface LevelProgressResult {
  currentLevel: number;
  totalXp: number;
  currentLevelXp: number;  // XP within current level
  xpForCurrentLevel: number;  // XP needed for current level
  xpToNextLevel: number;
  progressPercentage: number;
  unlockedRewards: LevelRequirement['rewards'];
  pendingRequirements?: LevelRequirement['additionalRequirements'];
}

export function calculateLevelProgress(
  totalXp: number,
  achievements: string[],
  tasks: string[]
): LevelProgressResult {
  const currentLevelConfig = LEVEL_CONFIGURATION.find(
    (level, index, array) => 
      totalXp >= level.xpRequired && 
      (index === array.length - 1 || totalXp < array[index + 1].xpRequired)
  );

  if (!currentLevelConfig) {
    throw new Error('Invalid XP amount');
  }

  const nextLevel = LEVEL_CONFIGURATION[currentLevelConfig.level];
  const xpForCurrentLevel = currentLevelConfig.xpRequired;
  const currentLevelXp = totalXp - xpForCurrentLevel;
  
  return {
    currentLevel: currentLevelConfig.level,
    totalXp,
    currentLevelXp,
    xpForCurrentLevel,
    xpToNextLevel: nextLevel ? nextLevel.xpRequired - totalXp : 0,
    progressPercentage: calculateProgress(totalXp, currentLevelConfig, nextLevel),
    unlockedRewards: currentLevelConfig.rewards || [],
    pendingRequirements: nextLevel?.additionalRequirements
  };
}

function calculateProgress(
  totalXp: number,
  currentLevelConfig: LevelRequirement,
  nextLevelConfig?: LevelRequirement
): number {
  if (!nextLevelConfig) {
    return 100;
  }
  const xpForCurrentLevel = currentLevelConfig.xpRequired;
  const xpForNextLevel = nextLevelConfig.xpRequired;
  const xpGained = totalXp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  return (xpGained / xpNeeded) * 100;
}
