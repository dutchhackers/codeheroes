import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
// import { NotificationService } from './NotificationService';
import { DatabaseInstance, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { GameActionType } from '@codeheroes/shared/types';

interface GameAction {
  userId: string;
  actionType: GameActionType;
  metadata: Record<string, any>;
}

interface ActionResult {
  xpGained: number;
  newStreak?: number;
  streakBonus?: number;
  badgesEarned?: string[];
  rewards?: Record<string, any>;
}

enum Collections {
  Users = 'users',
  User_UserBadges = 'badges',
  User_UserDailyStats = 'dailyStats',
  UserStats = 'userStats',
}

enum StreakType {
  CodePush = 'code_pushes',
  PullRequestMerge = 'pr_merges',
  PullRequestOpen = 'pr_opens',
}

export class GameProgressionService {
  private db: FirebaseFirestore.Firestore;
  // private notificationService: NotificationService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    // this.notificationService = new NotificationService();
  }

  // Main entry point for processing game actions
  async processGameAction(action: GameAction): Promise<ActionResult> {
    try {
      switch (action.actionType) {
        case 'code_push':
          return await this.handleCodePush(action);
        case 'pull_request_create':
          return await this.handlePullRequestCreate(action);
        default:
          throw new Error(`Unknown action type: ${action.actionType}`);
      }
    } catch (error) {
      console.error(`Error processing game action: ${action.actionType}`, error);
      throw new functions.https.HttpsError('internal', 'Failed to process game action');
    }
  }

  // Handle Pull request create action
  private async handlePullRequestCreate(action: GameAction): Promise<ActionResult> {
    const { userId, metadata } = action;
    const baseXP = 100;

    logger.log('Handling pull request merge', { userId, metadata });

    return await this.db.runTransaction(async (transaction) => {
      const userStatsRef = this.db.collection(Collections.UserStats).doc(userId);
      let userStats = await transaction.get(userStatsRef);

      if (!userStats.exists) {
        throw new Error('User stats not found');
      }

      const stats = userStats.data()!;

      // Calculate streak
      // Dev Note: streaks is counted by day
      const { newStreak, bonusXP } = await this.calculateStreak(
        transaction,
        userStatsRef,
        stats,
        StreakType.PullRequestMerge,
      );

      // Process additional catch bonuses
      const prBonuses = this.calculatePullRequestCreateBonuses(metadata);

      // Update daily stats
      await this.updateDailyStats(
        transaction,
        userId,
        StreakType.PullRequestMerge,
        baseXP + bonusXP + prBonuses.totalBonus,
      );

      // Record activity
      await this.recordActivity(transaction, userId, 'pull_request_create', baseXP + bonusXP + prBonuses.totalBonus, {
        ...metadata,
        streakDay: newStreak,
        bonusXP,
        prBonuses: prBonuses.breakdown,
      });

      // Check for achievements/badges
      const badgeResults = await this.processBadges(transaction, userId, {
        actionType: 'pull_request_create',
        totalMerges: stats.totalMerges + 1,
        currentStreak: newStreak,
      });

      // Return results
      return {
        xpGained: baseXP + bonusXP + prBonuses.totalBonus + badgeResults.totalBadgeXP,
        newStreak,
        streakBonus: bonusXP,
        badgesEarned: badgeResults.earnedBadges.map((b) => b.id),
        rewards: prBonuses.breakdown,
      };
    });
  }

  // Handle Code push action
  private async handleCodePush(action: GameAction): Promise<ActionResult> {
    const { actionType, userId, metadata } = action;
    const baseXP = 120;

    logger.log('Handling code push', { userId, metadata });

    return await this.db.runTransaction(async (transaction) => {
      const userStatsRef = this.db.collection(Collections.UserStats).doc(userId);
      let userStats = await transaction.get(userStatsRef);

      if (!userStats.exists) {
        throw new Error('User stats not found');
      }

      const stats = userStats.data()!;

      // Calculate streak
      await this.calculateStreak(transaction, userStatsRef, stats, StreakType.CodePush);
      const { newStreak, bonusXP } = await this.calculateStreak(transaction, userStatsRef, stats, StreakType.CodePush);

      // Process additional bonuses
      const pushBonuses = this.calculateCodePushBonuses(metadata);

      // Update daily stats
      await this.updateDailyStats(transaction, userId, StreakType.CodePush, baseXP + bonusXP + pushBonuses.totalBonus);

      // Record activity
      await this.recordActivity(transaction, userId, actionType, baseXP + bonusXP + pushBonuses.totalBonus, {
        ...metadata,
        streakDay: newStreak,
        bonusXP,
      });

      // Check for achievements/badges
      const badgeResults = await this.processBadges(transaction, userId, {
        actionType,
      });

      // Return results
      return {
        xpGained: baseXP + bonusXP + pushBonuses.totalBonus + badgeResults.totalBadgeXP,
        newStreak,
        streakBonus: bonusXP,
        badgesEarned: badgeResults.earnedBadges.map((b) => b.id),
        rewards: pushBonuses.breakdown,
      };
    });
  }

  // Helper: Calculate streak
  private async calculateStreak(
    transaction: FirebaseFirestore.Transaction,
    userStatsRef: FirebaseFirestore.DocumentReference,
    stats: FirebaseFirestore.DocumentData,
    streakType: string,
  ) {
    const today = new Date().toISOString().split('T')[0];

    // Initialize streak data if not present - this should only happen on first action / initialise userstats should happen at user login
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

  // Helper: Update daily stats
  private async updateDailyStats(
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

  // Helper: Record activity
  private async recordActivity(
    transaction: FirebaseFirestore.Transaction,
    userId: string,
    actionType: string,
    xpGained: number,
    metadata: Record<string, any>,
  ) {
    const activityRef = this.db.collection('users').doc(userId).collection('userActivities').doc();

    transaction.set(activityRef, {
      timestamp: Timestamp.now(),
      actionType,
      xpGained,
      metadata,
      createdAt: getCurrentTimeAsISO(),
      updatedAd: getCurrentTimeAsISO(),
    });
  }

  // Helper: Calculate Pull request create bonuses
  private calculatePullRequestCreateBonuses(metadata: Record<string, any>) {
    logger.log('Calculating pull request bonuses', { metadata });

    const bonuses = {
      multipleFiles: 0,
      significantChanges: 0,
    };

    if (metadata.changedFiles > 3) {
      bonuses.multipleFiles = 100;
      logger.log('Applied multiple files bonus', { bonus: bonuses.multipleFiles });
    }
    if (metadata.additions + metadata.deletions > 100) {
      bonuses.significantChanges = 200;
      logger.log('Applied significant changes bonus', { bonus: bonuses.significantChanges });
    }
    const result = {
      totalBonus: Object.values(bonuses).reduce((a, b) => a + b, 0),
      breakdown: bonuses,
    };

    logger.log('Pull request bonus calculation complete', result);
    return result;
  }

  private calculateCodePushBonuses(metadata: Record<string, any>) {
    logger.log('Calculating code push bonuses', { metadata });

    const bonuses = {
      multipleCommits: 0,
    };

    if (metadata.commits > 1) {
      bonuses.multipleCommits = 250;
      logger.log('Applied multiple commits bonus', { bonus: bonuses.multipleCommits });
    }

    const result = {
      totalBonus: Object.values(bonuses).reduce((a, b) => a + b, 0),
      breakdown: bonuses,
    };

    logger.log('Pull request bonus calculation complete', result);
    return result;
  }

  // Helper: Process badges
  private async processBadges(
    transaction: FirebaseFirestore.Transaction,
    userId: string,
    context: Record<string, any>,
  ) {
    logger.log('Processing badges', { userId, context });

    const earnedBadges = [];
    let totalBadgeXP = 0;

    // Check various badge conditions
    // Ref: see the original code on GitHub Discussions

    logger.log('Badge processing complete', {
      earnedBadges,
      totalBadgeXP,
    });

    return { earnedBadges, totalBadgeXP };
  }

  // Helper: Award badge
  private async awardBadge(
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
        earnedAt: admin.firestore.Timestamp.now(),
        xpAwarded: xpReward,
      };

      transaction.set(badgeRef, badgeData);

      // // Create notification
      // await this.notificationService.createBadgeNotification(userId, badgeId, xpReward);

      return badgeData;
    }

    return null;
  }
}
