import { DatabaseInstance, logger } from '@codeheroes/common';
import { Collections, UserBadge } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { getBadgeDefinition } from '../../config/badge-catalog.config';

export class BadgeService {
  private db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  /**
   * Grant a badge to a user by badge ID
   * Looks up the badge in the catalog and creates it in Firestore
   * Returns null if badge already earned or not found in catalog
   */
  async grantBadge(userId: string, badgeId: string): Promise<UserBadge | null> {
    // 1. Check if badge exists in catalog
    const badgeDefinition = getBadgeDefinition(badgeId);
    if (!badgeDefinition) {
      logger.warn('Badge not found in catalog', { badgeId });
      return null;
    }

    // 2. Check if user already has this badge
    if (await this.hasBadge(userId, badgeId)) {
      logger.info('User already has badge', { userId, badgeId });
      return null;
    }

    // 3. Create the badge document
    const userBadge: UserBadge = {
      id: badgeDefinition.id,
      name: badgeDefinition.name,
      description: badgeDefinition.description,
      icon: badgeDefinition.icon,
      imageUrl: badgeDefinition.imageUrl,
      rarity: badgeDefinition.rarity,
      category: badgeDefinition.category,
      earnedAt: new Date().toISOString(),
      metadata: badgeDefinition.metadata,
    };

    // 4. Save to Firestore
    const badgeRef = this.db.collection(Collections.Users).doc(userId).collection(Collections.Badges).doc(badgeId);

    await badgeRef.set(userBadge);

    logger.info('Badge granted', { userId, badgeId, badgeName: userBadge.name });

    return userBadge;
  }

  /**
   * Grant multiple badges to a user
   */
  async grantBadges(userId: string, badgeIds: string[]): Promise<UserBadge[]> {
    const granted: UserBadge[] = [];

    for (const badgeId of badgeIds) {
      const badge = await this.grantBadge(userId, badgeId);
      if (badge) {
        granted.push(badge);
      }
    }

    return granted;
  }

  /**
   * Check if a user has a specific badge
   */
  async hasBadge(userId: string, badgeId: string): Promise<boolean> {
    const badgeRef = this.db.collection(Collections.Users).doc(userId).collection(Collections.Badges).doc(badgeId);

    const doc = await badgeRef.get();
    return doc.exists;
  }

  /**
   * Get all badges for a user
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const snapshot = await this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Badges)
      .orderBy('earnedAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as UserBadge);
  }

  /**
   * Get badge count for a user
   */
  async getBadgeCount(userId: string): Promise<number> {
    const snapshot = await this.db.collection(Collections.Users).doc(userId).collection(Collections.Badges).count().get();

    return snapshot.data().count;
  }
}
