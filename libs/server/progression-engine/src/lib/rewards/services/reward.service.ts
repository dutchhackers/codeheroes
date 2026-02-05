import { DatabaseInstance, logger } from '@codeheroes/common';
import { NotificationService } from '@codeheroes/notifications';
import { Collections, RewardType } from '@codeheroes/types';
import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { EventPublisherService } from '../../progression/events/event-publisher.service';
import { BadgeService } from './badge.service';

export interface Reward {
  id: string;
  type: RewardType;
  name: string;
  description?: string;
  amount?: number;
  metadata?: Record<string, any>;
  earnedAt?: string;
}

export interface RewardClaim {
  rewardId: string;
  userId: string;
  claimedAt: string;
  expiresAt?: string;
}

/**
 * Result of transaction phase containing data needed for side effects
 */
interface RewardTransactionResult {
  alreadyGranted: boolean;
  rewardData?: {
    earnedAt: string;
    type: RewardType;
    badgeId?: string;
    amount?: number;
  };
}

export class RewardService {
  private db: Firestore;
  private notificationService: NotificationService;
  private badgeService: BadgeService;
  private eventService: EventPublisherService;

  constructor(badgeService?: BadgeService) {
    this.db = DatabaseInstance.getInstance();
    this.notificationService = new NotificationService();
    this.badgeService = badgeService || new BadgeService();
    this.eventService = new EventPublisherService();
  }

  /**
   * Grants a reward to a user using a two-phase approach:
   * 1. Transaction phase: Atomic state updates only (no external async operations)
   * 2. Side effect phase: Notifications and badge operations after transaction commits
   *
   * This prevents race conditions from async operations inside transactions.
   */
  async grantReward(userId: string, reward: Reward): Promise<void> {
    const userRef = this.db.collection(Collections.Users).doc(userId);
    const rewardRef = userRef.collection(Collections.Rewards).doc(reward.id);

    // Phase 1: Transaction for atomic state updates only
    const result = await this.db.runTransaction<RewardTransactionResult>(async (transaction) => {
      const doc = await transaction.get(rewardRef);
      if (doc.exists) {
        return { alreadyGranted: true }; // Reward already granted
      }

      const earnedAt = new Date().toISOString();
      const rewardData = {
        ...reward,
        earnedAt,
        claimed: false,
      };

      transaction.set(rewardRef, rewardData);

      // Update user stats to reflect new reward (use set+merge to handle missing docs)
      const statsRef = userRef.collection(Collections.Stats).doc('current');
      transaction.set(statsRef, {
        'stats.rewards.total': FieldValue.increment(1),
        'stats.rewards.lastEarned': earnedAt,
      }, { merge: true });

      // Handle POINTS reward type within transaction (it's a simple field update)
      if (reward.type === 'POINTS' && reward.amount) {
        transaction.set(statsRef, {
          xp: FieldValue.increment(reward.amount),
        }, { merge: true });
      }

      // Return data needed for side effects
      return {
        alreadyGranted: false,
        rewardData: {
          earnedAt,
          type: reward.type,
          badgeId: reward.type === 'BADGE' ? (reward.metadata?.badgeId ?? reward.id) : undefined,
          amount: reward.amount,
        },
      };
    });

    // If reward was already granted, no side effects needed
    if (result.alreadyGranted) {
      logger.info('Reward already granted, skipping side effects', {
        userId,
        rewardId: reward.id,
      });
      return;
    }

    // Phase 2: Side effects AFTER transaction commits successfully
    // These operations are idempotent so safe to retry
    try {
      // Create notification (non-critical, don't fail the reward grant)
      await this.notificationService.createNotification(userId, {
        type: 'REWARD_EARNED',
        title: 'New Reward!',
        message: `You've earned: ${reward.name}`,
        metadata: { rewardId: reward.id, rewardType: reward.type },
      });
    } catch (error) {
      logger.error('Failed to create reward notification', { userId, rewardId: reward.id, error });
      // Don't rethrow - notification is non-critical
    }

    // Handle BADGE reward type - grant the actual badge
    if (result.rewardData?.type === 'BADGE' && result.rewardData.badgeId) {
      try {
        await this.badgeService.grantBadge(userId, result.rewardData.badgeId);
      } catch (error) {
        logger.warn('Failed to grant badge after reward transaction committed', {
          userId,
          badgeId: result.rewardData.badgeId,
          rewardId: reward.id,
          error,
        });
        // Badge grant is idempotent via create(), so this is safe
        // Don't rethrow - the reward record was created successfully
      }
    }
  }

  async claimReward(userId: string, rewardId: string): Promise<boolean> {
    const userRef = this.db.collection(Collections.Users).doc(userId);
    const rewardRef = userRef.collection(Collections.Rewards).doc(rewardId);
    let success = false;

    await this.db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rewardRef);
      if (!doc.exists || doc.data()?.claimed) {
        return false;
      }

      const claim: RewardClaim = {
        rewardId,
        userId,
        claimedAt: new Date().toISOString(),
      };

      transaction.update(rewardRef, {
        claimed: true,
        claimedAt: claim.claimedAt,
      });

      // Update user stats
      transaction.update(userRef.collection(Collections.Stats).doc('current'), {
        'stats.rewards.claimed': FieldValue.increment(1),
        'stats.rewards.lastClaimed': claim.claimedAt,
      });

      success = true;
      return true;
    });

    if (success) {
      await this.notificationService.createNotification(userId, {
        type: 'REWARD_CLAIMED',
        title: 'Reward Claimed!',
        message: "You've successfully claimed your reward",
        metadata: { rewardId },
      });
    }

    return success;
  }

  async getUnclaimedRewards(userId: string): Promise<Reward[]> {
    const snapshot = await this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Rewards)
      .where('claimed', '==', false)
      .get();

    return snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
        }) as Reward,
    );
  }

  async getRewardHistory(userId: string, limit = 50): Promise<Reward[]> {
    const snapshot = await this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Rewards)
      .orderBy('earnedAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
        }) as Reward,
    );
  }
}
