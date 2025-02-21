import { DatabaseInstance } from '@codeheroes/common';
import { Firestore, FieldValue } from 'firebase-admin/firestore';
import { NotificationService } from './notification.service';
import { BadgeService } from './badge.service';
import { ProgressionEventService } from './progression-event.service';
import { RewardType } from '../interfaces/level';

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

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.notificationService = new NotificationService();
    this.badgeService = new BadgeService();
    this.eventService = new ProgressionEventService();
  }

  async grantReward(userId: string, reward: Reward): Promise<void> {
    const rewardRef = this.db.collection('users').doc(userId).collection('rewards').doc(reward.id);

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
            transaction.update(this.db.collection('userStats').doc(userId), {
              xp: FieldValue.increment(reward.amount),
            });
          }
          break;
      }
    });
  }

  async claimReward(userId: string, rewardId: string): Promise<boolean> {
    const rewardRef = this.db.collection('users').doc(userId).collection('rewards').doc(rewardId);

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

      transaction.update(rewardRef, { claimed: true, claimedAt: claim.claimedAt });
      transaction.set(this.db.collection('rewardClaims').doc(), claim);

      success = true;
      return true;
    });

    if (success) {
      await this.notificationService.createNotification(userId, {
        type: 'REWARD_CLAIMED',
        title: 'Reward Claimed!',
        message: "You've successfully claimed your reward",
        metadata: { rewardId: rewardId },
      });
    }

    return success;
  }

  async getUnclaimedRewards(userId: string): Promise<Reward[]> {
    const snapshot = await this.db
      .collection('users')
      .doc(userId)
      .collection('rewards')
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
      .collection('users')
      .doc(userId)
      .collection('rewards')
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
