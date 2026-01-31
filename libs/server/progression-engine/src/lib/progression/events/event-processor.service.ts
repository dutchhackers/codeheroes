import { DatabaseInstance, logger } from '@codeheroes/common';
import { NotificationService } from '@codeheroes/notifications';
import { GameActionActivity, isGameActionActivity, ProgressionEvent, ProgressionEventType } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { BadgeService } from '../../rewards/services/badge.service';
import { MilestoneBadgeService } from '../../rewards/services/milestone-badge.service';
import { SpecialBadgeService } from '../../rewards/services/special-badge.service';
import { RewardActivityService } from '../../rewards/services/reward-activity.service';
import { getLevelRequirements } from '../../config/level-thresholds';

/**
 * Service responsible for processing progression events
 */
export class EventProcessorService {
  private db: Firestore;
  private notificationService: NotificationService;
  private badgeService: BadgeService;
  private milestoneBadgeService: MilestoneBadgeService;
  private specialBadgeService: SpecialBadgeService;
  private rewardActivityService: RewardActivityService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.notificationService = new NotificationService();
    this.badgeService = new BadgeService();
    this.milestoneBadgeService = new MilestoneBadgeService(this.badgeService);
    this.specialBadgeService = new SpecialBadgeService(this.badgeService);
    this.rewardActivityService = new RewardActivityService();
  }

  /**
   * Handle a progression event
   * @param event The progression event to handle
   */
  async handleEvent(event: ProgressionEvent): Promise<void> {
    logger.info('Handling progression event', { type: event.type, userId: event.userId });

    switch (event.type) {
      case ProgressionEventType.LEVEL_UP:
        await this.handleLevelUp(event);
        break;
      case ProgressionEventType.BADGE_EARNED:
        await this.handleBadgeEarned(event);
        break;
      case ProgressionEventType.ACTIVITY_RECORDED:
        await this.handleActivityRecorded(event);
        break;
      case ProgressionEventType.XP_GAINED:
        await this.handleXpGained(event);
        break;
    }
  }

  /**
   * Handle level up events - grants badges for each level gained
   * @param event Level up event
   */
  private async handleLevelUp(event: ProgressionEvent): Promise<void> {
    const { userId, data } = event;
    const newLevel = data.state?.level;
    const previousLevel = data.previousState?.level || 0;
    const totalXp = data.state?.xp || 0;

    if (!newLevel) return;

    logger.info('Processing level up', { userId, previousLevel, newLevel });

    // Record level-up activity in the feed
    await this.rewardActivityService.recordLevelUp(userId, previousLevel, newLevel, totalXp);

    // Grant badges for ALL levels gained (handles multiple level-ups at once)
    for (let level = previousLevel + 1; level <= newLevel; level++) {
      const levelConfig = getLevelRequirements(level);

      if (levelConfig?.rewards?.badges) {
        logger.info('Granting level badges', { userId, level, badges: levelConfig.rewards.badges });

        const grantedBadges = await this.badgeService.grantBadges(userId, levelConfig.rewards.badges);

        // Record badge activity and send notification for each granted badge
        for (const badge of grantedBadges) {
          // Record badge earned activity in the feed
          await this.rewardActivityService.recordBadgeEarned(userId, badge, {
            type: 'level-up',
            level,
          });

          await this.notificationService.createNotification(userId, {
            type: 'BADGE_EARNED',
            title: 'New Badge Earned!',
            message: `You earned: ${badge.icon} ${badge.name}`,
            metadata: { badgeId: badge.id, level },
          });
        }
      }
    }

    // Send level-up notification
    await this.notificationService.createNotification(userId, {
      type: 'LEVEL_UP',
      title: 'Level Up!',
      message: `Congratulations! You've reached level ${newLevel}!`,
      metadata: { level: newLevel, previousLevel },
    });
  }

  /**
   * Handle badge earned events
   * @param event Badge earned event
   */
  private async handleBadgeEarned(event: ProgressionEvent): Promise<void> {
    const { userId, data } = event;
    const badgeId = data.badgeId;
    if (!badgeId) return;

    // Badge already granted by BadgeService, just log
    logger.info('Badge earned event processed', { userId, badgeId });
  }

  /**
   * Handle activity recorded events
   * Checks for milestone badges based on activity counts
   * @param event Activity recorded event
   */
  private async handleActivityRecorded(event: ProgressionEvent): Promise<void> {
    const { userId, data } = event;
    const activity = data.activity;
    const state = data.state;

    if (!activity || !state) {
      logger.warn('Activity recorded event missing activity or state', { userId });
      return;
    }

    // Only process game-action activities for milestone and special badges
    if (!isGameActionActivity(activity)) {
      logger.debug('Skipping non-game-action activity for badge checks', { userId, type: activity.type });
      return;
    }

    const gameActivity = activity as GameActionActivity;
    const activityType = gameActivity.sourceActionType;
    const newCount = state.counters?.actions?.[activityType];

    if (newCount === undefined) {
      logger.warn('Activity count not found in state', { userId, activityType });
      return;
    }

    logger.info('Checking milestone badges', { userId, activityType, count: newCount });

    // Check and grant milestone badge if threshold reached
    const grantedMilestoneBadge = await this.milestoneBadgeService.checkAndGrantMilestoneBadge(
      userId,
      activityType,
      newCount
    );

    if (grantedMilestoneBadge) {
      // Record badge earned activity in the feed
      await this.rewardActivityService.recordBadgeEarned(userId, grantedMilestoneBadge, {
        type: 'milestone',
        activityType,
        count: newCount,
      });

      await this.notificationService.createNotification(userId, {
        type: 'BADGE_EARNED',
        title: 'Milestone Reached!',
        message: `You earned: ${grantedMilestoneBadge.icon} ${grantedMilestoneBadge.name}`,
        metadata: {
          badgeId: grantedMilestoneBadge.id,
          activityType,
          count: newCount,
        },
      });
    }

    // Check and grant special time-based badges
    const grantedSpecialBadges = await this.specialBadgeService.checkTimeBadges(userId, gameActivity);

    for (const badge of grantedSpecialBadges) {
      // Record badge earned activity in the feed
      await this.rewardActivityService.recordBadgeEarned(userId, badge, {
        type: 'special',
      });

      await this.notificationService.createNotification(userId, {
        type: 'BADGE_EARNED',
        title: 'Special Badge Earned!',
        message: `You earned: ${badge.icon} ${badge.name}`,
        metadata: {
          badgeId: badge.id,
          category: 'special',
        },
      });
    }

    logger.info('Activity recorded event processed', { userId, activityType });
  }

  /**
   * Handle XP gained events
   * @param event XP gained event
   */
  private async handleXpGained(event: ProgressionEvent): Promise<void> {
    // Handle XP gained events if needed
    // Most XP-related processing is handled by the progression service
  }
}
