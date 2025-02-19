import { getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { GameActionType } from '@codeheroes/shared/types';
import { Firestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { ActionResult, GameAction } from '../../core/interfaces/action';
import { StreakType } from '../../core/interfaces/streak';
import { StreakService } from '../../core/services/streak.service';

export enum Collections {
  Users = 'users',
  User_UserBadges = 'badges',
  User_UserDailyStats = 'dailyStats',
  UserStats = 'userStats',
  User_UserActivities = 'userActivities',
}

export abstract class BaseActionHandler {
  protected abstract actionType: GameActionType;
  protected abstract streakType: StreakType;
  protected streakService: StreakService;

  constructor(protected db: Firestore) {
    this.streakService = new StreakService(db);
  }

  // Template method - defines the algorithm structure
  async handle(action: GameAction): Promise<ActionResult> {
    const { userId, metadata } = action;
    const baseXP = this.calculateBaseXp();

    logger.info(`Handling ${this.actionType}`, { userId, metadata });

    return await this.db.runTransaction(async (transaction) => {
      const userStatsRef = this.db.collection(Collections.UserStats).doc(userId);
      const userStats = await transaction.get(userStatsRef);

      if (!userStats.exists) {
        throw new Error('User stats not found');
      }

      const stats = userStats.data()!;

      // Calculate streak bonus using the streak service
      const { newStreak, bonusXP } = await this.streakService.calculateStreak(
        transaction,
        userStatsRef,
        stats,
        this.streakType,
      );

      // Calculate action-specific bonuses
      const actionBonuses = this.calculateBonuses(metadata);
      const totalXP = baseXP + bonusXP + actionBonuses.totalBonus;

      await this.updateDailyStats(transaction, userId, this.streakType, totalXP);
      await this.recordActivity(transaction, userId, this.actionType, totalXP, {
        ...metadata,
        streakDay: newStreak,
        bonusXP,
        rewards: actionBonuses.breakdown,
      });

      const badgeResults = await this.processBadges(transaction, userId, {
        actionType: this.actionType,
        ...this.getAdditionalBadgeContext(stats),
        currentStreak: newStreak,
      });

      return {
        xpGained: totalXP + badgeResults.totalBadgeXP,
        newStreak,
        streakBonus: bonusXP,
        rewards: actionBonuses.breakdown,
        badgesEarned: badgeResults.earnedBadges.map((b) => b.id),
      };
    });
  }

  // Abstract methods that must be implemented by derived classes
  protected abstract calculateBaseXp(): number;
  protected abstract calculateBonuses(metadata: Record<string, any>): {
    totalBonus: number;
    breakdown: Record<string, number>;
  };
  protected abstract getAdditionalBadgeContext(stats: FirebaseFirestore.DocumentData): Record<string, any>;

  // Helper methods
  protected async updateDailyStats(
    transaction: FirebaseFirestore.Transaction,
    userId: string,
    actionType: string,
    xp: number,
  ) {
    const today = new Date().toISOString().split('T')[0];
    const dailyStatsRef = this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.User_UserDailyStats)
      .doc(today);

    transaction.set(
      dailyStatsRef,
      {
        date: today,
        activities: {
          [actionType]: FieldValue.increment(1),
        },
        totalXP: FieldValue.increment(xp),
      },
      { merge: true },
    );
  }

  protected async recordActivity(
    transaction: FirebaseFirestore.Transaction,
    userId: string,
    actionType: string,
    xpGained: number,
    metadata: Record<string, any>,
  ) {
    const activityRef = this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.User_UserActivities)
      .doc();

    transaction.set(activityRef, {
      timestamp: Timestamp.now(),
      actionType,
      xpGained,
      metadata,
      createdAt: getCurrentTimeAsISO(),
      updatedAt: getCurrentTimeAsISO(),
    });
  }

  protected async processBadges(
    transaction: FirebaseFirestore.Transaction,
    userId: string,
    context: Record<string, any>,
  ) {
    const earnedBadges = [];
    let totalBadgeXP = 0;
    return { earnedBadges, totalBadgeXP };
  }

  protected async awardBadge(
    transaction: FirebaseFirestore.Transaction,
    userId: string,
    badgeId: string,
    xpReward: number,
  ) {
    const badgeRef = this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.User_UserBadges)
      .doc(badgeId);

    const badge = await transaction.get(badgeRef);

    if (!badge.exists) {
      const badgeData = {
        id: badgeId,
        earnedAt: Timestamp.now(),
        xpAwarded: xpReward,
      };

      transaction.set(badgeRef, badgeData);
      return badgeData;
    }

    return null;
  }
}
