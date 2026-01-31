import { logger } from '@codeheroes/common';
import { UserBadge } from '@codeheroes/types';
import { BadgeService } from './badge.service';
import { getMilestoneBadgeForCount } from '../../config/milestone-badges.config';

export class MilestoneBadgeService {
  private badgeService: BadgeService;

  constructor(badgeService?: BadgeService) {
    this.badgeService = badgeService || new BadgeService();
  }

  /**
   * Check if an activity count milestone was reached and grant badge
   * @param userId User ID
   * @param activityType The type of activity (e.g., 'code_push', 'pull_request_create')
   * @param newCount The NEW count after the activity was recorded
   * @returns Granted badge or null if no milestone reached
   */
  async checkAndGrantMilestoneBadge(userId: string, activityType: string, newCount: number): Promise<UserBadge | null> {
    // Check if this exact count matches a milestone threshold
    const milestoneBadge = getMilestoneBadgeForCount(activityType, newCount);

    if (!milestoneBadge) {
      // No milestone at this count
      return null;
    }

    logger.info('Milestone reached, granting badge', {
      userId,
      activityType,
      count: newCount,
      badgeId: milestoneBadge.id,
    });

    // Grant the badge (BadgeService handles duplicate prevention)
    return this.badgeService.grantBadge(userId, milestoneBadge.id);
  }
}
