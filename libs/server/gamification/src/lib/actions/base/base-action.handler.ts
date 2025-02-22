import { getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { Collections, GameActionType } from '@codeheroes/shared/types';
import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { ActionResult, GameAction } from '../../core/interfaces/action';
import { ProgressionService } from '../../core/progression/progression.service';

export abstract class BaseActionHandler {
  protected abstract actionType: GameActionType;
  private progressionService: ProgressionService;

  constructor(protected db: Firestore) {
    this.progressionService = new ProgressionService();
  }

  async handle(action: GameAction): Promise<ActionResult> {
    const { userId, metadata } = action;
    logger.info(`Starting action handler for ${this.actionType}`, { userId, metadata });

    // Calculate XP and bonuses
    const baseXP = this.calculateBaseXp();
    const bonuses = this.calculateBonuses(metadata);
    const totalXP = baseXP + bonuses.totalBonus;

    logger.info('XP calculation details', {
      actionType: this.actionType,
      userId,
      baseXP,
      bonuses: bonuses.breakdown,
      totalXP,
    });

    // Process the action with progression
    logger.info('Updating progression with calculated XP', { userId, totalXP });
    const progressionUpdate = await this.progressionService.updateProgression(userId, {
      xpGained: totalXP,
      activityType: this.actionType,
    });

    // Record activity
    await this.recordActivity(userId, totalXP, {
      ...metadata,
      level: progressionUpdate.level,
      bonuses: bonuses.breakdown,
    });

    logger.info('Action handling completed', {
      userId,
      actionType: this.actionType,
      xpGained: totalXP,
      newLevel: progressionUpdate.level,
    });

    return {
      xpGained: totalXP,
      level: progressionUpdate.level,
    };
  }

  protected abstract calculateBaseXp(): number;
  protected abstract calculateBonuses(metadata: Record<string, any>): {
    totalBonus: number;
    breakdown: Record<string, number>;
  };

  private async recordActivity(userId: string, xpGained: number, metadata: Record<string, any>) {
    const userStatsRef = this.db.collection(Collections.UserStats).doc(userId);
    const activityRef = userStatsRef.collection(Collections.UserStats_Activities).doc();
    const now = getCurrentTimeAsISO();

    await this.db.runTransaction(async (transaction) => {
      // Check if user stats exist
      const statsDoc = await transaction.get(userStatsRef);

      const activity = {
        timestamp: now,
        actionType: this.actionType,
        xpGained,
        metadata,
        createdAt: now,
      };

      // Create user stats if they don't exist
      if (!statsDoc.exists) {
        transaction.set(userStatsRef, {
          userId,
          xp: 0,
          level: 1,
          activityStats: {
            total: 0,
            byType: {},
          },
          createdAt: now,
          updatedAt: now,
        });
      }

      // Record the activity
      transaction.set(activityRef, activity);

      // Update activity stats
      transaction.update(userStatsRef, {
        [`activityStats.total`]: FieldValue.increment(1),
        [`activityStats.byType.${this.actionType}`]: FieldValue.increment(1),
        [`activityStats.lastActivity`]: {
          type: this.actionType,
          timestamp: now,
        },
        updatedAt: now,
      });
    });
  }
}
