import { DatabaseInstance, logger } from '@codeheroes/common';
import { NotificationService } from '@codeheroes/notifications';
import { Collections } from '@codeheroes/shared/types';
import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { BadgeService } from '../services/badge.service';
import { ProgressionEvent, ProgressionEventType } from './event-types';

export class UnifiedEventHandlerService {
  private db: Firestore;
  private notificationService: NotificationService;
  private badgeService: BadgeService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.notificationService = new NotificationService();
    // Pass this instance to BadgeService to prevent circular instantiation
    this.badgeService = new BadgeService(this);
  }

  async handleEvent(event: ProgressionEvent): Promise<void> {
    logger.info('Handling progression event', { type: event.type, userId: event.userId });

    switch (event.type) {
      case ProgressionEventType.LEVEL_UP:
        await this.handleLevelUp(event);
        break;
      case ProgressionEventType.STREAK_UPDATED:
        await this.handleStreakUpdate(event);
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

  private async handleLevelUp(event: ProgressionEvent): Promise<void> {
    const { userId, data } = event;
    const newLevel = data.state?.level;
    if (!newLevel) return;

    await this.db.runTransaction(async (transaction) => {
      // Record achievement
      await this.recordAchievement(transaction, userId, {
        id: `level_${newLevel}`,
        name: `Level ${newLevel}`,
        description: `Reached level ${newLevel}`,
        timestamp: event.timestamp,
      });

      // Level-based achievements
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
  }

  private async handleStreakUpdate(event: ProgressionEvent): Promise<void> {
    const { userId, data } = event;
    const streaks = data.state?.streaks;
    if (!streaks) return;

    await this.db.runTransaction(async (transaction) => {
      for (const [streakType, days] of Object.entries(streaks)) {
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

  private async handleBadgeEarned(event: ProgressionEvent): Promise<void> {
    const { userId, data } = event;
    const badgeId = data.badgeId;
    if (!badgeId) return;

    await this.db.runTransaction(async (transaction) => {
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

  private async handleActivityRecorded(event: ProgressionEvent): Promise<void> {
    const { userId, data } = event;
    const activity = data.activity;
    if (!activity) return;

    try {
      const stats = await this.getActivityStats(userId, activity.type);

      // First-time achievements
      if (stats.total === 1) {
        await this.recordAchievement(null, userId, {
          id: `first_${activity.type}`,
          name: `First ${activity.type.replace(/_/g, ' ')}`,
          description: `Completed your first ${activity.type.replace(/_/g, ' ')}`,
          timestamp: event.timestamp,
        });
      }

      // Milestone achievements
      const milestones = [10, 50, 100, 500];
      const nextMilestone = milestones.find((m) => stats.total === m);
      if (nextMilestone) {
        await this.recordAchievement(null, userId, {
          id: `${activity.type}_milestone_${nextMilestone}`,
          name: `${activity.type.replace(/_/g, ' ')} Master ${nextMilestone}`,
          description: `Completed ${nextMilestone} ${activity.type.replace(/_/g, ' ')}s`,
          timestamp: event.timestamp,
        });
      }
    } catch (error) {
      logger.error('Error processing activity recorded event:', error);
      throw error;
    }
  }

  private async handleXpGained(event: ProgressionEvent): Promise<void> {
    // Handle XP gained events if needed
  }

  private async recordAchievement(
    transaction: FirebaseFirestore.Transaction | null,
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

    const updateData = {
      ...achievement,
      'stats.achievements.total': FieldValue.increment(1),
      'stats.achievements.lastEarned': achievement.timestamp,
    };

    if (transaction) {
      transaction.set(achievementRef, achievement);
      transaction.update(userRef, updateData);
    } else {
      await this.db.runTransaction(async (t) => {
        t.set(achievementRef, achievement);
        t.update(userRef, updateData);
      });
    }
  }

  private async getActivityStats(userId: string, activityType: string): Promise<{ total: number }> {
    const statsDoc = await this.db.collection(Collections.UserStats).doc(userId).get();
    const stats = statsDoc.data()?.activityStats || {};
    return {
      total: stats.byType?.[activityType] || 0,
    };
  }
}
