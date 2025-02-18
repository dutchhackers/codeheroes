import { getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { FieldValue, Firestore, Timestamp } from 'firebase-admin/firestore';
import { ActionResult, Collections, GameAction, StreakType } from '../types';

export abstract class BaseActionHandler {
  protected abstract actionType: string;

  constructor(protected db: Firestore) {}

  abstract handle(action: GameAction): Promise<ActionResult>;

  protected calculateBaseXp(): number {
    return 100;
  }

  protected abstract calculateBonuses(metadata: Record<string, any>): {
    totalBonus: number;
    breakdown: Record<string, number>;
  };

  protected async calculateStreak(
    transaction: FirebaseFirestore.Transaction,
    userStatsRef: FirebaseFirestore.DocumentReference,
    stats: FirebaseFirestore.DocumentData,
    streakType: StreakType,
  ) {
    const today = new Date().toISOString().split('T')[0];

    // Initialize streak data if not present
    if (!stats.streaks) {
      stats.streaks = {};
    }

    const streakData = stats.streaks[streakType] || {
      current: 0,
      best: 0,
      lastActionDate: null,
    };

    logger.log('Starting streak calculation', {
      streakType,
      today,
      currentStreak: streakData.current,
      lastActionDate: streakData.lastActionDate,
    });

    if (streakData.lastActionDate === today) {
      logger.log('Action already performed today, maintaining current streak', {
        currentStreak: streakData.current,
      });
      return {
        newStreak: streakData.current,
        bonusXP: 0,
      };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    let bonusXP = 0;

    if (streakData.lastActionDate === yesterdayStr) {
      newStreak = streakData.current + 1;
      logger.log('Continuing streak from yesterday', {
        previousStreak: streakData.current,
        newStreak,
      });

      // Calculate streak bonus
      if (newStreak === 7) bonusXP = 3000;
      else if (newStreak === 5) bonusXP = 2000;
      else if (newStreak === 3) bonusXP = 1000;
      else if (newStreak === 1) bonusXP = 500;

      logger.log('Calculated streak bonus', { newStreak, bonusXP });
    } else {
      logger.log('Streak broken - resetting to 1', {
        lastActionDate: streakData.lastActionDate,
        yesterdayStr,
      });
    }

    // Update streak data
    transaction.update(userStatsRef, {
      [`streaks.${streakType}.current`]: newStreak,
      [`streaks.${streakType}.best`]: Math.max(newStreak, streakData.best),
      [`streaks.${streakType}.lastActionDate`]: today,
    });

    logger.log('Streak calculation complete', {
      streakType,
      newStreak,
      bonusXP,
      best: Math.max(newStreak, streakData.best),
    });

    return { newStreak, bonusXP };
  }

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

    logger.log('Updating daily stats', {
      userId,
      actionType,
      xp,
      date: today,
    });

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

    logger.log('Daily stats update complete', {
      userId,
      actionType,
      xpGained: xp,
      date: today,
      ref: dailyStatsRef.path,
    });
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
    logger.log('Processing badges', { userId, context });

    const earnedBadges = [];
    let totalBadgeXP = 0;

    // Process badges - to be implemented by child classes if needed
    logger.log('Badge processing complete', {
      earnedBadges,
      totalBadgeXP,
    });

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
