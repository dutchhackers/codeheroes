import { DatabaseInstance, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import {
  Activity,
  BadgeEarnedActivity,
  Collections,
  LevelUpActivity,
  UserBadge,
} from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { getXpProgress } from '../../config/level-thresholds';

/**
 * Trigger information for badge activities
 */
export interface BadgeTrigger {
  type: 'level-up' | 'milestone' | 'special';
  level?: number;
  activityType?: string;
  count?: number;
}

/**
 * Service responsible for creating activity records for rewards (badges, level-ups)
 * These activities appear in the activity feed alongside game action activities.
 */
export class RewardActivityService {
  private db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  /**
   * Record a badge earned activity in the user's activity feed
   * @param userId User ID
   * @param badge The badge that was earned
   * @param trigger Optional information about what triggered the badge
   * @returns The created activity
   */
  async recordBadgeEarned(
    userId: string,
    badge: UserBadge,
    trigger?: BadgeTrigger
  ): Promise<BadgeEarnedActivity> {
    const now = getCurrentTimeAsISO();
    const activityId = `badge_${Date.now()}_${badge.id}`;

    const activity: BadgeEarnedActivity = {
      id: activityId,
      userId,
      type: 'badge-earned',
      badge: {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        rarity: badge.rarity,
        category: typeof badge.category === 'string' ? badge.category : badge.category,
      },
      trigger,
      userFacingDescription: this.generateBadgeDescription(badge, trigger),
      createdAt: now,
      updatedAt: now,
      eventId: activityId,
      provider: 'system',
    };

    await this.saveActivity(userId, activity);

    logger.info('Badge earned activity recorded', {
      userId,
      badgeId: badge.id,
      activityId,
    });

    return activity;
  }

  /**
   * Record a level up activity in the user's activity feed
   * @param userId User ID
   * @param previousLevel The level before leveling up
   * @param newLevel The new level achieved
   * @param totalXp Total XP at the time of level up
   * @returns The created activity
   */
  async recordLevelUp(
    userId: string,
    previousLevel: number,
    newLevel: number,
    totalXp: number
  ): Promise<LevelUpActivity> {
    const now = getCurrentTimeAsISO();
    const activityId = `levelup_${Date.now()}_${newLevel}`;

    const xpProgress = getXpProgress(totalXp);

    const activity: LevelUpActivity = {
      id: activityId,
      userId,
      type: 'level-up',
      level: {
        previous: previousLevel,
        new: newLevel,
      },
      xp: {
        total: totalXp,
        toNextLevel: xpProgress.xpToNextLevel,
      },
      userFacingDescription: this.generateLevelUpDescription(previousLevel, newLevel),
      createdAt: now,
      updatedAt: now,
      eventId: activityId,
      provider: 'system',
    };

    await this.saveActivity(userId, activity);

    logger.info('Level up activity recorded', {
      userId,
      previousLevel,
      newLevel,
      activityId,
    });

    return activity;
  }

  /**
   * Save an activity to Firestore
   */
  private async saveActivity(userId: string, activity: Activity): Promise<void> {
    const activityRef = this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Activities)
      .doc(activity.id);

    await activityRef.set(activity);
  }

  /**
   * Generate a user-facing description for a badge earned activity
   */
  private generateBadgeDescription(badge: UserBadge, trigger?: BadgeTrigger): string {
    const badgeName = badge.name;

    if (trigger) {
      switch (trigger.type) {
        case 'level-up':
          return `Earned ${badge.icon} ${badgeName} for reaching level ${trigger.level}!`;
        case 'milestone':
          return `Earned ${badge.icon} ${badgeName} for ${trigger.count} ${trigger.activityType?.replace(/_/g, ' ')}!`;
        case 'special':
          return `Earned ${badge.icon} ${badgeName}!`;
      }
    }

    return `Earned ${badge.icon} ${badgeName}!`;
  }

  /**
   * Generate a user-facing description for a level up activity
   */
  private generateLevelUpDescription(previousLevel: number, newLevel: number): string {
    if (newLevel - previousLevel > 1) {
      return `Leveled up from ${previousLevel} to ${newLevel}!`;
    }
    return `Reached level ${newLevel}!`;
  }
}
