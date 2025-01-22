import { LevelCalculationResult } from "../../core/models/gamification-domain.model";

export function calculateLevel(
  currentLevel: number,
  currentXpToNext: number,
  totalXp: number,
  gameSettings: { baseXpPerLevel: number; xpMultiplier: number }
): LevelCalculationResult {
  let level = currentLevel;
  let xpForNextLevel = currentXpToNext;

  while (totalXp >= xpForNextLevel) {
    level++;
    xpForNextLevel = Math.floor(gameSettings.baseXpPerLevel * Math.pow(gameSettings.xpMultiplier, level - 1));
  }

  return {
    level,
    xpToNextLevel: xpForNextLevel,
  };
}
