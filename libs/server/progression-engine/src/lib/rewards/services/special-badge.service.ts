import { DatabaseInstance, logger } from '@codeheroes/common';
import { GameActionActivity, Collections, UserBadge } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { BadgeService } from './badge.service';
import {
  SPECIAL_BADGES,
  isEarlyBird,
  isNightOwl,
  isWeekend,
  getWeekendId,
} from '../../config/special-badges.config';

/**
 * Service for checking and granting special badges based on time and behavior patterns
 */
export class SpecialBadgeService {
  private db: Firestore;
  private badgeService: BadgeService;

  constructor(badgeService?: BadgeService) {
    this.db = DatabaseInstance.getInstance();
    this.badgeService = badgeService || new BadgeService();
  }

  /**
   * Check all time-based special badges for a game action activity
   * @param userId User ID
   * @param activity The recorded game action activity
   * @returns Array of granted badges
   */
  async checkTimeBadges(userId: string, activity: GameActionActivity): Promise<UserBadge[]> {
    const grantedBadges: UserBadge[] = [];
    const timestamp = activity.createdAt || new Date().toISOString();

    // Check Early Bird (before 7 AM)
    if (isEarlyBird(timestamp)) {
      const badge = await this.grantBadgeIfNotEarned(userId, 'early_bird');
      if (badge) {
        logger.info('Early Bird badge granted', { userId, time: timestamp });
        grantedBadges.push(badge);
      }
    }

    // Check Night Owl (after 11 PM)
    if (isNightOwl(timestamp)) {
      const badge = await this.grantBadgeIfNotEarned(userId, 'night_owl');
      if (badge) {
        logger.info('Night Owl badge granted', { userId, time: timestamp });
        grantedBadges.push(badge);
      }
    }

    // Check Weekend Warrior (5 activities on a weekend)
    if (isWeekend(timestamp)) {
      const badge = await this.checkWeekendWarrior(userId, timestamp);
      if (badge) {
        grantedBadges.push(badge);
      }
    }

    return grantedBadges;
  }

  /**
   * Check if user qualifies for Weekend Warrior badge
   * Tracks weekend activity count and grants badge at threshold
   */
  private async checkWeekendWarrior(userId: string, timestamp: string): Promise<UserBadge | null> {
    const weekendId = getWeekendId(timestamp);
    const threshold = SPECIAL_BADGES.weekend_warrior.metadata?.threshold || 5;

    try {
      // Get or create weekend activity counter
      const counterRef = this.db
        .collection(Collections.Users)
        .doc(userId)
        .collection('weekendActivity')
        .doc(weekendId);

      const result = await this.db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        const currentCount = counterDoc.exists ? (counterDoc.data()?.count || 0) : 0;
        const newCount = currentCount + 1;

        // Update the counter
        transaction.set(counterRef, {
          weekendId,
          count: newCount,
          lastUpdated: new Date().toISOString(),
        }, { merge: true });

        return newCount;
      });

      logger.debug('Weekend activity count', { userId, weekendId, count: result });

      // Check if threshold reached exactly (to avoid duplicate grants)
      if (result === threshold) {
        const badge = await this.grantBadgeIfNotEarned(userId, 'weekend_warrior');
        if (badge) {
          logger.info('Weekend Warrior badge granted', { userId, weekendId, count: result });
          return badge;
        }
      }
    } catch (error) {
      logger.error('Error checking weekend warrior badge', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return null;
  }

  /**
   * Grant a badge if the user hasn't already earned it
   */
  private async grantBadgeIfNotEarned(userId: string, badgeId: string): Promise<UserBadge | null> {
    // Check if badge exists in special badges
    if (!SPECIAL_BADGES[badgeId]) {
      logger.warn('Special badge not found', { badgeId });
      return null;
    }

    // BadgeService.grantBadge already handles duplicate prevention
    return this.badgeService.grantBadge(userId, badgeId);
  }
}
