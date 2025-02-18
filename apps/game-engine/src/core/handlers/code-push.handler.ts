import { logger } from '@codeheroes/common';
import { ActionResult, GameAction, StreakType, Collections } from '../types';
import { BaseActionHandler } from './base-action.handler';

export class CodePushHandler extends BaseActionHandler {
  protected actionType = 'code_push';

  async handle(action: GameAction): Promise<ActionResult> {
    const { userId, metadata } = action;
    const baseXP = this.calculateBaseXp();

    logger.info('Handling code push', { userId, metadata });

    return await this.db.runTransaction(async (transaction) => {
      const userStatsRef = this.db.collection(Collections.UserStats).doc(userId);
      const userStats = await transaction.get(userStatsRef);

      if (!userStats.exists) {
        throw new Error('User stats not found');
      }

      const stats = userStats.data()!;
      const { newStreak, bonusXP } = await this.calculateStreak(transaction, userStatsRef, stats, StreakType.CodePush);

      const pushBonuses = this.calculateBonuses(metadata);
      const totalXP = baseXP + bonusXP + pushBonuses.totalBonus;

      // Use base class helper methods
      await this.updateDailyStats(transaction, userId, StreakType.CodePush, totalXP);

      await this.recordActivity(transaction, userId, this.actionType, totalXP, {
        ...metadata,
        streakDay: newStreak,
        bonusXP,
        rewards: pushBonuses.breakdown,
      });

      const badgeResults = await this.processBadges(transaction, userId, {
        actionType: this.actionType,
        totalPushes: stats.totalPushes + 1,
        currentStreak: newStreak,
      });

      return {
        xpGained: totalXP + badgeResults.totalBadgeXP,
        newStreak,
        streakBonus: bonusXP,
        rewards: pushBonuses.breakdown,
        badgesEarned: badgeResults.earnedBadges.map((b) => b.id),
      };
    });
  }

  protected calculateBaseXp(): number {
    return 120; // Code push base XP
  }

  protected calculateBonuses(metadata: Record<string, any>) {
    const bonuses = {
      multipleCommits: metadata.commits > 1 ? 250 : 0,
    };

    return {
      totalBonus: Object.values(bonuses).reduce((a, b) => a + b, 0),
      breakdown: bonuses,
    };
  }
}
