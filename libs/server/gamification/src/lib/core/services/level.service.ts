import { getXpProgress, getLevelRequirements, getNextLevelRequirements } from '../../constants/level-thresholds';
import { LevelRequirement } from '../interfaces/level';

export class LevelService {
  calculateLevelProgress(totalXp: number) {
    const { currentLevel, currentLevelXp, xpToNextLevel } = getXpProgress(totalXp);
    const currentLevelRequirements = getLevelRequirements(currentLevel);
    const nextLevelRequirements = getNextLevelRequirements(currentLevel);

    return {
      level: currentLevel,
      progress: xpToNextLevel > 0 ? Math.floor((currentLevelXp / xpToNextLevel) * 100) : 100,
      currentLevelXp,
      xpToNextLevel,
      totalXp,
      rewards: currentLevelRequirements?.rewards || [],
      nextLevelRequirements: nextLevelRequirements?.additionalRequirements || [],
    };
  }

  getNextLevelRequirements(level: number): {
    xpNeeded: number;
    requirements?: LevelRequirement['additionalRequirements'];
    rewards?: LevelRequirement['rewards'];
  } {
    const nextLevel = getNextLevelRequirements(level);
    if (!nextLevel) {
      return { xpNeeded: 0 };
    }

    return {
      xpNeeded: nextLevel.xpRequired - getLevelRequirements(level)!.xpRequired,
      requirements: nextLevel.additionalRequirements,
      rewards: nextLevel.rewards,
    };
  }
}
