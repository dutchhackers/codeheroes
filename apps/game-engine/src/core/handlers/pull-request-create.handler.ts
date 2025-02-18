import { logger } from '@codeheroes/common';
import { ActionResult, GameAction, StreakType, Collections } from '../types';
import { BaseActionHandler } from './base-action.handler';

export class PullRequestCreateHandler extends BaseActionHandler {
  protected actionType = 'pull_request_create';

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
      const { newStreak, bonusXP } = await this.calculateStreak(
        transaction,
        userStatsRef,
        stats,
        StreakType.PullRequestCreate,
      );

      const prBonuses = this.calculateBonuses(metadata);
      const totalXP = baseXP + bonusXP + prBonuses.totalBonus;

      // Use base class helper methods
      await this.updateDailyStats(transaction, userId, StreakType.PullRequestCreate, totalXP);

      await this.recordActivity(transaction, userId, this.actionType, totalXP, {
        ...metadata,
        streakDay: newStreak,
        bonusXP,
        rewards: prBonuses.breakdown,
      });

      const badgeResults = await this.processBadges(transaction, userId, {
        actionType: this.actionType,
        totalPRs: stats.totalPRs + 1,
        currentStreak: newStreak,
      });

      return {
        xpGained: totalXP + badgeResults.totalBadgeXP,
        newStreak,
        streakBonus: bonusXP,
        rewards: prBonuses.breakdown,
        badgesEarned: badgeResults.earnedBadges.map((b) => b.id),
      };
    });
  }

  protected calculateBaseXp(): number {
    return 100; // PR create base XP
  }

  protected calculateBonuses(metadata: Record<string, any>) {
    const bonuses = {
      multipleFiles: metadata.changedFiles > 3 ? 100 : 0,
      significantChanges: metadata.additions + metadata.deletions > 100 ? 200 : 0,
    };

    return {
      totalBonus: Object.values(bonuses).reduce((a, b) => a + b, 0),
      breakdown: bonuses,
    };
  }
}
