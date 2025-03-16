import { DatabaseInstance, logger } from '@codeheroes/common';
import { NotificationService } from '@codeheroes/notifications';
import { Collections, ProgressionEvent, ProgressionEventType } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { BadgeService } from '../../rewards/services/badge.service';

/**
 * Service responsible for processing progression events
 */
export class EventProcessorService {
  private db: Firestore;
  private notificationService: NotificationService;
  private badgeService: BadgeService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.notificationService = new NotificationService();
    // Pass this instance to BadgeService to prevent circular instantiation
    this.badgeService = new BadgeService(this);
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
   * Handle level up events
   * @param event Level up event
   */
  private async handleLevelUp(event: ProgressionEvent): Promise<void> {
    const { userId, data } = event;
    const newLevel = data.state?.level;
    if (!newLevel) return;

    await this.db.runTransaction(async (transaction) => {
      const userRef = this.db.collection(Collections.Users).doc(userId);
      const achievementRef = userRef.collection(Collections.Achievements);

      // Record achievement
      await this.recordAchievement(transaction, achievementRef, {
        id: `level_${newLevel}`,
        name: `Level ${newLevel}`,
        description: `Reached level ${newLevel}`,
        timestamp: event.timestamp,
      });

      // Level-based achievements
      if (newLevel === 5) {
        await this.recordAchievement(transaction, achievementRef, {
          id: 'intermediate_hero',
          name: 'Intermediate Hero',
          description: 'Reached level 5',
          timestamp: event.timestamp,
        });
      } else if (newLevel === 10) {
        await this.recordAchievement(transaction, achievementRef, {
          id: 'advanced_hero',
          name: 'Advanced Hero',
          description: 'Reached level 10',
          timestamp: event.timestamp,
        });
      }

      await this.notificationService.createNotification(userId, {
        type: 'LEVEL_UP',
        title: 'Level Up!',
        message: `Congratulations! You've reached level ${newLevel}!`,
        metadata: { level: newLevel },
      });
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

    await this.db.runTransaction(async (transaction) => {
      const userRef = this.db.collection(Collections.Users).doc(userId);
      const userBadges = await transaction.get(userRef.collection(Collections.Badges));

      const badgeCount = userBadges.size;
      const achievementRef = userRef.collection(Collections.Achievements);

      await this.notificationService.createNotification(userId, {
        type: 'BADGE_EARNED',
        title: 'New Badge!',
        message: `You've earned a new badge!`,
        metadata: { badgeId },
      });

      if (badgeCount === 5) {
        await this.recordAchievement(transaction, achievementRef, {
          id: 'badge_collector',
          name: 'Badge Collector',
          description: 'Earned 5 different badges',
          timestamp: event.timestamp,
        });
      } else if (badgeCount === 10) {
        await this.recordAchievement(transaction, achievementRef, {
          id: 'badge_master',
          name: 'Badge Master',
          description: 'Earned 10 different badges',
          timestamp: event.timestamp,
        });
      }
    });
  }

  /**
   * Handle activity recorded events
   * @param event Activity recorded event
   */
  private async handleActivityRecorded(event: ProgressionEvent): Promise<void> {
    const { userId, data } = event;
    const activity = data.activity;
    if (!activity) return;

    try {
      // Use sourceActionType instead of the type property
      const actionType = activity.sourceActionType;
      const stats = await this.getActivityStats(userId, actionType);
      const userRef = this.db.collection(Collections.Users).doc(userId);
      const achievementRef = userRef.collection(Collections.Achievements);

      // First-time achievements
      if (stats.total === 1) {
        await this.recordAchievement(null, achievementRef, {
          id: `first_${actionType}`,
          name: `First ${actionType.replace(/_/g, ' ')}`,
          description: `Completed your first ${actionType.replace(/_/g, ' ')}`,
          timestamp: event.timestamp,
        });
      }

      // Milestone achievements
      const milestones = [10, 50, 100, 500];
      const nextMilestone = milestones.find((m) => stats.total === m);
      if (nextMilestone) {
        await this.recordAchievement(null, achievementRef, {
          id: `${actionType}_milestone_${nextMilestone}`,
          name: `${actionType.replace(/_/g, ' ')} Master ${nextMilestone}`,
          description: `Completed ${nextMilestone} ${actionType.replace(/_/g, ' ')}s`,
          timestamp: event.timestamp,
        });
      }
    } catch (error) {
      logger.error('Error processing activity recorded event:', error);
      throw error;
    }
  }

  /**
   * Handle XP gained events
   * @param event XP gained event
   */
  private async handleXpGained(event: ProgressionEvent): Promise<void> {
    // Handle XP gained events if needed
    // Most XP-related processing is handled by the progression service
  }

  /**
   * Record an achievement
   * @param transaction Firestore transaction or null
   * @param achievementRef Reference to achievements collection
   * @param achievement Achievement data to record
   */
  private async recordAchievement(
    transaction: FirebaseFirestore.Transaction | null,
    achievementRef: FirebaseFirestore.CollectionReference,
    achievement: {
      id: string;
      name: string;
      description: string;
      timestamp: string;
    },
  ): Promise<void> {
    const docRef = achievementRef.doc(achievement.id);

    if (transaction) {
      transaction.set(docRef, achievement);
    } else {
      await docRef.set(achievement);
    }
  }

  /**
   * Get activity stats for a user and activity type
   * @param userId User ID
   * @param activityType Activity type
   * @returns Activity stats
   */
  private async getActivityStats(userId: string, activityType: string): Promise<{ total: number }> {
    const userRef = this.db.collection(Collections.Users).doc(userId);
    const statsDoc = await userRef.collection(Collections.Stats).doc('current').get();
    const stats = statsDoc.data()?.activityStats || {};
    return {
      total: stats.byType?.[activityType] || 0,
    };
  }
}
