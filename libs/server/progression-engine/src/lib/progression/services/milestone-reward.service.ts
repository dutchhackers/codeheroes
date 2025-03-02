import { logger } from '@codeheroes/common';
import { GameAction, ProgressionState } from '@codeheroes/types';
import { LevelService } from '../../rewards/services/level.service';
import { RewardService } from '../../rewards/services/reward.service';

/**
 * Service focused on detecting and granting milestone rewards
 */
export class MilestoneRewardService {
  private levelService: LevelService;
  private rewardService: RewardService;

  constructor() {
    this.levelService = new LevelService();
    this.rewardService = new RewardService();
  }

  /**
   * Check if a user's current state has reached any milestone that should trigger rewards
   */
  async checkAndGrantMilestoneRewards(
    userId: string,
    state: ProgressionState,
    previousState?: Partial<ProgressionState>,
    action?: GameAction,
  ): Promise<boolean> {
    let rewardsGranted = false;

    // Check for level-up milestone
    if (previousState && state.level > (previousState.level || 0)) {
      logger.info('Level-up milestone detected', {
        userId,
        previousLevel: previousState.level,
        newLevel: state.level,
      });

      await this.handleLevelUpRewards(userId, state.level);
      rewardsGranted = true;
    }

    // Check for activity count milestones
    if (action) {
      const actionMilestone = this.checkActivityMilestone(action, state);
      if (actionMilestone) {
        logger.info('Activity milestone detected', {
          userId,
          actionType: action.type,
          milestone: actionMilestone,
        });

        await this.handleActivityMilestone(userId, action.type, actionMilestone);
        rewardsGranted = true;
      }
    }

    return rewardsGranted;
  }

  /**
   * Check if the action has reached a milestone based on its count
   */
  private checkActivityMilestone(action: GameAction, state: ProgressionState): number | null {
    const activityCount = state.counters?.actions?.[action.type] || 0;
    const milestones = [10, 50, 100, 500];

    const milestone = milestones.find((m) => activityCount === m);
    return milestone || null;
  }

  /**
   * Handle rewards for reaching an activity count milestone
   */
  private async handleActivityMilestone(userId: string, actionType: string, milestone: number): Promise<void> {
    // Generate a unique ID for the reward
    const rewardId = `${actionType}_milestone_${milestone}_${Date.now()}`;

    await this.rewardService.grantReward(userId, {
      id: rewardId,
      type: 'BADGE',
      name: `${actionType.replace(/_/g, ' ')} Expert`,
      description: `Completed ${milestone} ${actionType.replace(/_/g, ' ')} actions`,
    });

    logger.info('Activity milestone reward granted', { userId, actionType, milestone });
  }

  /**
   * Handle rewards for level-up milestones
   */
  private async handleLevelUpRewards(userId: string, newLevel: number): Promise<void> {
    const previousLevel = newLevel - 1;
    const levelRequirements = this.levelService.getNextLevelRequirements(previousLevel);

    if (levelRequirements.rewards && levelRequirements.rewards.length > 0) {
      logger.info('Granting level-up rewards', {
        userId,
        newLevel,
        rewardCount: levelRequirements.rewards.length,
      });

      for (const reward of levelRequirements.rewards) {
        const rewardId = `level_${newLevel}_reward_${reward.id}_${Date.now()}`;

        await this.rewardService.grantReward(userId, {
          id: rewardId,
          type: reward.type,
          name: reward.name,
          amount: reward.amount,
        });
      }
    }
  }
}
