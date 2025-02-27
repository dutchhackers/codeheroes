import { LevelRequirementItem, LevelReward, RewardType } from '@codeheroes/shared/types';
import { getLevelRequirements, getNextLevelRequirements, getXpProgress } from '../../constants/level-thresholds';

export class LevelService {
  calculateLevelProgress(totalXp: number) {
    const { currentLevel, currentLevelXp, xpToNextLevel } = getXpProgress(totalXp);
    const currentLevelConfig = getLevelRequirements(currentLevel);
    const nextLevelConfig = getNextLevelRequirements(currentLevel);

    return {
      level: currentLevel,
      progress: xpToNextLevel > 0 ? Math.floor((currentLevelXp / xpToNextLevel) * 100) : 100,
      currentLevelXp,
      xpToNextLevel,
      totalXp,
      rewards: this.mapConfigRewardsToLevelRewards(currentLevelConfig?.rewards),
      requirements: [], // We'll leave this empty for now as it's not critical
    };
  }

  getNextLevelRequirements(level: number): {
    xpNeeded: number;
    requirements: LevelRequirementItem[];
    rewards: LevelReward[];
  } {
    const nextLevel = getNextLevelRequirements(level);
    if (!nextLevel) {
      return {
        xpNeeded: 0,
        requirements: [],
        rewards: [],
      };
    }

    const currentLevel = getLevelRequirements(level);
    return {
      xpNeeded: nextLevel.xpRequired - (currentLevel?.xpRequired || 0),
      requirements: [], // We'll implement requirements later if needed
      rewards: this.mapConfigRewardsToLevelRewards(nextLevel.rewards),
    };
  }

  private mapConfigRewardsToLevelRewards(configRewards?: {
    title?: string;
    badges?: string[];
    unlocks?: string[];
  }): LevelReward[] {
    const rewards: LevelReward[] = [];

    if (!configRewards) {
      return rewards;
    }

    if (configRewards.title) {
      rewards.push({
        type: 'POINTS' as RewardType,
        id: `title_${configRewards.title.toLowerCase().replace(/\s+/g, '_')}`,
        name: configRewards.title,
      });
    }

    if (configRewards.badges) {
      configRewards.badges.forEach((badge) => {
        rewards.push({
          type: 'BADGE' as RewardType,
          id: badge,
          name: badge,
        });
      });
    }

    if (configRewards.unlocks) {
      configRewards.unlocks.forEach((unlock) => {
        rewards.push({
          type: 'FEATURE_UNLOCK' as RewardType,
          id: unlock,
          name: unlock,
        });
      });
    }

    return rewards;
  }
}
