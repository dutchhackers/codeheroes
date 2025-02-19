export const LEVEL_THRESHOLDS = {
  BASE_XP: 100,
  MULTIPLIER: 1.5,
  MAX_LEVEL: 100,
};

export function calculateXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(LEVEL_THRESHOLDS.BASE_XP * Math.pow(LEVEL_THRESHOLDS.MULTIPLIER, level - 1));
}

export function getLevelFromXp(totalXp: number): number {
  let level = 1;
  while (level < LEVEL_THRESHOLDS.MAX_LEVEL && calculateXpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

export function getXpProgress(totalXp: number): {
  currentLevel: number;
  currentLevelXp: number;
  xpToNextLevel: number;
} {
  const currentLevel = getLevelFromXp(totalXp);
  const currentLevelBaseXp = calculateXpForLevel(currentLevel);
  const nextLevelXp = calculateXpForLevel(currentLevel + 1);

  return {
    currentLevel,
    currentLevelXp: totalXp - currentLevelBaseXp,
    xpToNextLevel: nextLevelXp - currentLevelBaseXp,
  };
}
