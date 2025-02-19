import { getXpProgress } from '../../constants/level-thresholds';

export class LevelService {
  calculateLevelProgress(totalXp: number) {
    const { currentLevel, currentLevelXp, xpToNextLevel } = getXpProgress(totalXp);

    return {
      level: currentLevel,
      progress: Math.floor((currentLevelXp / xpToNextLevel) * 100),
      currentLevelXp,
      xpToNextLevel,
      totalXp,
    };
  }

  getNextLevelRequirements(level: number) {
    const currentProgress = getXpProgress(level);
    return {
      xpNeeded: currentProgress.xpToNextLevel - currentProgress.currentLevelXp,
      suggestedActivities: [
        { type: 'code_push', count: Math.ceil(currentProgress.xpToNextLevel / 120) },
        { type: 'pull_request_merge', count: Math.ceil(currentProgress.xpToNextLevel / 300) },
      ],
    };
  }
}
