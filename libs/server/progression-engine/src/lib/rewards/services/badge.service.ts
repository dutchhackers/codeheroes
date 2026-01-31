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
   * Uses atomic create() to prevent race conditions with concurrent calls
   */
  async grantBadge(userId: string, badgeId: string): Promise<UserBadge | null> {
    // 1. Check if badge exists in catalog
    const badgeDefinition = getBadgeDefinition(badgeId);
    if (!badgeDefinition) {
      logger.warn('Badge not found in catalog', { badgeId });
      return null;
    }

    // 2. Create the badge document
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

    // 3. Use atomic create() to ensure we only grant the badge if it doesn't exist
    // This prevents race conditions where two concurrent calls both pass an existence check
    // Use badgeDefinition.id consistently for document ID to prevent path/field mismatch
    const badgeRef = this.db.collection(Collections.Users).doc(userId).collection(Collections.Badges).doc(badgeDefinition.id);

    try {
      await badgeRef.create(userBadge);
      logger.info('Badge granted', { userId, badgeId: badgeDefinition.id, badgeName: userBadge.name });
      return userBadge;
    } catch (error: unknown) {
      // If the document already exists, Firestore throws an error with code 6 (ALREADY_EXISTS)
      const firestoreError = error as { code?: number | string };
      if (firestoreError.code === 6 || firestoreError.code === 'ALREADY_EXISTS') {
        logger.info('User already has badge', { userId, badgeId });
        return null;
      }
      throw error;
    }
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
