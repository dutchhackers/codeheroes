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

// Firestore error code for ALREADY_EXISTS
const ALREADY_EXISTS_ERROR_CODE = 6;

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
   * Generates a deterministic activity ID for badge earned events.
   * The ID format depends on the trigger type to ensure uniqueness:
   * - Level-up badges: badge_{userId}_{badgeId}_level{level}
   * - Milestone badges: badge_{userId}_{badgeId}_count{count}
   * - Special/one-time badges: badge_{userId}_{badgeId}
   *
   * @param userId User ID
   * @param badgeId Badge ID
   * @param trigger Optional trigger information
   * @returns Deterministic activity ID
   */
  private generateBadgeActivityId(userId: string, badgeId: string, trigger?: BadgeTrigger): string {
    const baseId = `badge_${userId}_${badgeId}`;

    if (!trigger) {
      return baseId;
    }

    switch (trigger.type) {
      case 'level-up':
        return `${baseId}_level${trigger.level}`;
      case 'milestone':
        return `${baseId}_count${trigger.count}`;
      case 'special':
      default:
        return baseId;
    }
  }

  /**
   * Record a badge earned activity in the user's activity feed
   * Uses deterministic IDs to ensure idempotency and prevent duplicates.
   *
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
    // Use deterministic ID based on userId, badgeId, and trigger to ensure idempotency
    const activityId = this.generateBadgeActivityId(userId, badge.id, trigger);

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
        category: badge.category,
      },
      trigger,
      userFacingDescription: this.generateBadgeDescription(badge, trigger),
      createdAt: now,
      updatedAt: now,
      eventId: activityId,
      provider: 'system',
    };

    const saved = await this.saveActivityIdempotent(userId, activity);

    if (saved) {
      logger.info('Badge earned activity recorded', {
        userId,
        badgeId: badge.id,
        activityId,
      });
    } else {
      logger.info('Badge earned activity already exists, skipping', {
        userId,
        badgeId: badge.id,
        activityId,
      });
    }

    return activity;
  }

  /**
   * Record a level up activity in the user's activity feed
   * Uses deterministic IDs to ensure idempotency and prevent duplicates.
   *
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
    // Use deterministic ID based on userId and level to ensure idempotency
    // This prevents duplicate activities if multiple events are processed for the same level-up
    const activityId = `levelup_${userId}_${newLevel}`;

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

    const saved = await this.saveActivityIdempotent(userId, activity);

    if (saved) {
      logger.info('Level up activity recorded', {
        userId,
        previousLevel,
        newLevel,
        activityId,
      });
    } else {
      logger.info('Level up activity already exists, skipping', {
        userId,
        newLevel,
        activityId,
      });
    }

    return activity;
  }

  /**
   * Save an activity to Firestore with idempotency guarantee.
   * Uses atomic create() to prevent duplicates from concurrent calls.
   *
   * @param userId User ID
   * @param activity Activity to save
   * @returns true if activity was created, false if it already existed
   */
  private async saveActivityIdempotent(userId: string, activity: Activity): Promise<boolean> {
    const activityRef = this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Activities)
      .doc(activity.id);

    try {
      // Use create() which atomically fails if document already exists
      await activityRef.create(activity);
      return true;
    } catch (error: unknown) {
      // Check if this is an ALREADY_EXISTS error
      const firestoreError = error as { code?: number | string };
      if (firestoreError.code === ALREADY_EXISTS_ERROR_CODE || firestoreError.code === 'ALREADY_EXISTS') {
        return false; // Already exists, not an error
      }
      throw error; // Rethrow other errors
    }
  }

  /**
   * @deprecated Use saveActivityIdempotent instead
   * Legacy save method for backwards compatibility
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
