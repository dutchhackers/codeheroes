import { DatabaseInstance, logger } from '@codeheroes/common';
import { NotificationService } from '@codeheroes/notifications';
import { Collections, ProgressionEvent, ProgressionEventType } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { BadgeService } from '../../rewards/services/badge.service';
import { MilestoneBadgeService } from '../../rewards/services/milestone-badge.service';
import { getLevelRequirements } from '../../config/level-thresholds';

/**
 * Service responsible for processing progression events
 */
export class EventProcessorService {
  private db: Firestore;
  private notificationService: NotificationService;
  private badgeService: BadgeService;
  private milestoneBadgeService: MilestoneBadgeService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.notificationService = new NotificationService();
    this.badgeService = new BadgeService();
    this.milestoneBadgeService = new MilestoneBadgeService(this.badgeService);
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

    if (!newLevel) return;

    logger.info('Processing level up', { userId, previousLevel, newLevel });

    // Grant badges for ALL levels gained (handles multiple level-ups at once)
    for (let level = previousLevel + 1; level <= newLevel; level++) {
      const levelConfig = getLevelRequirements(level);

      if (levelConfig?.rewards?.badges) {
        logger.info('Granting level badges', { userId, level, badges: levelConfig.rewards.badges });

        const grantedBadges = await this.badgeService.grantBadges(userId, levelConfig.rewards.badges);

        // Send notification for each granted badge
        for (const badge of grantedBadges) {
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

    const activityType = activity.sourceActionType;
    const newCount = state.counters?.actions?.[activityType];

    if (newCount === undefined) {
      logger.warn('Activity count not found in state', { userId, activityType });
      return;
    }

    logger.info('Checking milestone badges', { userId, activityType, count: newCount });

    // Check and grant milestone badge if threshold reached
    const grantedBadge = await this.milestoneBadgeService.checkAndGrantMilestoneBadge(userId, activityType, newCount);

    if (grantedBadge) {
      // Send notification for the new badge
      await this.notificationService.createNotification(userId, {
        type: 'BADGE_EARNED',
        title: 'Milestone Reached!',
        message: `You earned: ${grantedBadge.icon} ${grantedBadge.name}`,
        metadata: {
          badgeId: grantedBadge.id,
          activityType,
          count: newCount,
        },
      });
    }

    logger.info('Activity recorded event processed', { userId, activityType: activity.sourceActionType });
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
