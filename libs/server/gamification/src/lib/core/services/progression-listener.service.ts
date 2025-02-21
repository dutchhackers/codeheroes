import { DatabaseInstance } from '@codeheroes/common';
import { Firestore } from 'firebase-admin/firestore';
import { ProgressionEventType, ProgressionEvent } from './progression-event.service';
import { NotificationService } from './notification.service';
import { BadgeService } from './badge.service';
import { ProgressionState } from '../interfaces/progression';
import { StreakType } from '../interfaces/streak';

export class ProgressionListenerService {
  private db: Firestore;
  private notificationService: NotificationService;
  private badgeService: BadgeService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.notificationService = new NotificationService();
    this.badgeService = new BadgeService();
  }

  async handleLevelUp(event: ProgressionEvent) {
    const { userId, data } = event;
    const newLevel = data.state?.level;

    if (!newLevel) return;

    // Create level up notification
    await this.notificationService.createNotification(userId, {
      type: 'LEVEL_UP',
      title: 'Level Up!',
      message: `Congratulations! You've reached level ${newLevel}!`,
      metadata: { level: newLevel },
    });

    // Process potential level-based badges
    await this.badgeService.processBadges(userId, {
      actionType: 'level_up',
      totalActions: newLevel,
    });
  }

  async handleStreakUpdate(event: ProgressionEvent) {
    const { userId, data } = event;
    const streakDays = data.state?.streaks?.[StreakType.CodePush]; // Updated to use StreakType enum
    if (!streakDays) return;

    // Process streak-based badges
    await this.badgeService.processBadges(userId, {
      actionType: 'daily_streak',
      currentStreak: streakDays,
    });

    // Create streak milestone notifications
    if (streakDays === 7 || streakDays === 30) {
      await this.notificationService.createNotification(userId, {
        type: 'STREAK_MILESTONE',
        title: 'Streak Achievement!',
        message: `Amazing! You've maintained a ${streakDays}-day streak!`,
        metadata: { streakDays },
      });
    }
  }

  async handleBadgeEarned(event: ProgressionEvent) {
    const { userId, data } = event;
    const badgeId = data.badgeId;
    if (!badgeId) return;

    await this.notificationService.createNotification(userId, {
      type: 'BADGE_EARNED',
      title: 'New Badge!',
      message: "You've earned a new badge!",
      metadata: { badgeId },
    });
  }

  // Method to handle any incoming progression event
  async handleEvent(event: ProgressionEvent): Promise<void> {
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
    }
  }
}
