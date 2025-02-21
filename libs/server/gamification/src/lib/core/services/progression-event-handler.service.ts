import { DatabaseInstance, logger } from '@codeheroes/common';
import { NotificationService } from '@codeheroes/notifications';
import { Collections } from '@codeheroes/shared/types';
import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { BadgeService } from './badge.service';
import { ProgressionEvent } from './progression-event.service';

export class ProgressionEventHandlerService {
  private db: Firestore;
  private notificationService: NotificationService;
  private badgeService: BadgeService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.notificationService = new NotificationService();
    this.badgeService = new BadgeService();
  }

  async handleLevelUp(event: ProgressionEvent): Promise<void> {
    logger.info('Starting handleLevelUp', { userId: event.userId });
    const { userId, data } = event;
    const newLevel = data.state?.level;
    if (!newLevel) {
      logger.warn('No level data in event', { userId, data });
      return;
    }

    logger.info('Processing level up', { userId, newLevel });
    await this.db.runTransaction(async (transaction) => {
      // Record level up achievement
      await this.recordAchievement(transaction, userId, {
        id: `level_${newLevel}`,
        name: `Level ${newLevel}`,
        description: `Reached level ${newLevel}`,
        timestamp: event.timestamp,
      });

      // Check for level-based achievements
      if (newLevel === 5) {
        await this.recordAchievement(transaction, userId, {
          id: 'intermediate_hero',
          name: 'Intermediate Hero',
          description: 'Reached level 5',
          timestamp: event.timestamp,
        });
      } else if (newLevel === 10) {
        await this.recordAchievement(transaction, userId, {
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
    logger.info('Level up processed successfully', { userId, newLevel });
  }

  async handleStreakUpdate(event: ProgressionEvent): Promise<void> {
    const { userId, data } = event;
    const streaks = data.state?.streaks;
    if (!streaks) return;

    await this.db.runTransaction(async (transaction) => {
      for (const [streakType, days] of Object.entries(streaks)) {
        // Record streak achievements
        if (days === 7) {
          await this.recordAchievement(transaction, userId, {
            id: `weekly_streak_${streakType}`,
            name: 'Weekly Warrior',
            description: `Maintained a 7-day streak in ${streakType}`,
            timestamp: event.timestamp,
          });
        } else if (days === 30) {
          await this.recordAchievement(transaction, userId, {
            id: `monthly_streak_${streakType}`,
            name: 'Monthly Master',
            description: `Maintained a 30-day streak in ${streakType}`,
            timestamp: event.timestamp,
          });
        }

        // Create notification for significant streaks
        if (days === 7 || days === 30) {
          await this.notificationService.createNotification(userId, {
            type: 'STREAK_MILESTONE',
            title: 'Streak Achievement!',
            message: `Amazing! You've maintained your ${streakType} streak for ${days} days!`,
            metadata: { streakType, days },
          });
        }
      }
    });
  }

  async handleBadgeEarned(event: ProgressionEvent): Promise<void> {
    const { userId, data } = event;
    const badgeId = data.badgeId;
    if (!badgeId) return;

    await this.db.runTransaction(async (transaction) => {
      // Get user's current badges
      const userBadges = await transaction.get(
        this.db.collection(Collections.Users).doc(userId).collection(Collections.User_UserBadges),
      );

      const badgeCount = userBadges.size;

      await this.notificationService.createNotification(userId, {
        type: 'BADGE_EARNED',
        title: 'New Badge!',
        message: `You've earned a new badge!`,
        metadata: { badgeId },
      });

      // Check for badge collection achievements
      if (badgeCount === 5) {
        await this.recordAchievement(transaction, userId, {
          id: 'badge_collector',
          name: 'Badge Collector',
          description: 'Earned 5 different badges',
          timestamp: event.timestamp,
        });
      } else if (badgeCount === 10) {
        await this.recordAchievement(transaction, userId, {
          id: 'badge_master',
          name: 'Badge Master',
          description: 'Earned 10 different badges',
          timestamp: event.timestamp,
        });
      }
    });
  }

  private async recordAchievement(
    transaction: FirebaseFirestore.Transaction,
    userId: string,
    achievement: {
      id: string;
      name: string;
      description: string;
      timestamp: string;
    },
  ): Promise<void> {
    const userRef = this.db.collection(Collections.Users).doc(userId);
    const achievementRef = userRef.collection(Collections.Achievements).doc(achievement.id);

    transaction.set(achievementRef, achievement);
    transaction.update(userRef, {
      'stats.achievements.total': FieldValue.increment(1),
      'stats.achievements.lastEarned': achievement.timestamp,
    });
  }
}
