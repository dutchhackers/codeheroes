import { DatabaseInstance } from '@codeheroes/common';
import { NotificationService } from '@codeheroes/notifications';
import { Collections } from '@codeheroes/shared/types';
import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { RewardType } from '@codeheroes/shared/types';
import { BadgeService } from './badge.service';
import { ProgressionEventService } from '../events/event-types';

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

export class RewardService {
  private db: Firestore;
  private notificationService: NotificationService;
  private badgeService: BadgeService;
  private eventService: ProgressionEventService;

  constructor(badgeService?: BadgeService) {
    this.db = DatabaseInstance.getInstance();
    this.notificationService = new NotificationService();
    this.badgeService = badgeService || new BadgeService();
    this.eventService = new ProgressionEventService();
  }

  async grantReward(userId: string, reward: Reward): Promise<void> {
    const userRef = this.db.collection(Collections.Users).doc(userId);
    const rewardRef = userRef.collection(Collections.Rewards).doc(reward.id);

    await this.db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rewardRef);
      if (doc.exists) {
        return; // Reward already granted
      }

      const rewardData = {
        ...reward,
        earnedAt: new Date().toISOString(),
        claimed: false,
      };

      transaction.set(rewardRef, rewardData);

      // Create notification
      await this.notificationService.createNotification(userId, {
        type: 'REWARD_EARNED',
        title: 'New Reward!',
        message: `You've earned: ${reward.name}`,
        metadata: { rewardId: reward.id, rewardType: reward.type },
      });

      // Update user stats to reflect new reward
      transaction.update(userRef.collection(Collections.Stats).doc('current'), {
        'stats.rewards.total': FieldValue.increment(1),
        'stats.rewards.lastEarned': rewardData.earnedAt,
      });

      // Handle specific reward types
      switch (reward.type) {
        case 'BADGE':
          await this.badgeService.processBadges(userId, {
            actionType: 'reward_badge',
            totalActions: 1,
          });
          break;
        case 'POINTS':
          if (reward.amount) {
            transaction.update(userRef.collection(Collections.Stats).doc('current'), {
              xp: FieldValue.increment(reward.amount),
            });
          }
          break;
      }
    });
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
