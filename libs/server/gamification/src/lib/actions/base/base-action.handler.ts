import { getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { GameActionType } from '@codeheroes/shared/types';
import { Firestore, FieldValue } from 'firebase-admin/firestore';
import { ActionResult, GameAction } from '../../core/interfaces/action';
import { ProgressionService } from '../../core/services/progression.service';
import { StreakType } from '../../core/interfaces/streak';
import { Collections } from '../../core/constants/collections';

export abstract class BaseActionHandler {
  protected abstract actionType: GameActionType;
  protected abstract streakType: StreakType;
  private progressionService: ProgressionService;

  constructor(protected db: Firestore) {
    this.progressionService = new ProgressionService();
  }

  async handle(action: GameAction): Promise<ActionResult> {
    const { userId, metadata } = action;
    logger.info(`Handling ${this.actionType}`, { userId, metadata });

    // Calculate XP and bonuses
    const baseXP = this.calculateBaseXp();
    logger.info(`Base XP for ${this.actionType}: ${baseXP}`);
    const bonuses = this.calculateBonuses(metadata);
    logger.info(`Bonuses for ${this.actionType}: ${JSON.stringify(bonuses)}`);
    const totalXP = baseXP + bonuses.totalBonus;
    logger.info(`Total XP for ${this.actionType}: ${totalXP}`);

    // Process the action with progression
    const progressionUpdate = await this.progressionService.updateProgression(userId, {
      xpGained: totalXP,
      activityType: this.actionType,
      streakUpdates: {
        code_pushes: this.streakType === 'code_pushes' ? metadata.streakDay || 1 : 0,
        pr_creations: this.streakType === 'pr_creations' ? metadata.streakDay || 1 : 0,
        pr_closes: this.streakType === 'pr_closes' ? metadata.streakDay || 1 : 0,
        pr_merges: this.streakType === 'pr_merges' ? metadata.streakDay || 1 : 0,
      },
    });

    // Record activity
    await this.recordActivity(userId, totalXP, {
      ...metadata,
      level: progressionUpdate.level,
      bonuses: bonuses.breakdown,
    });

    return {
      xpGained: totalXP,
      newStreak: metadata.streakDay,
      streakBonus: bonuses.breakdown.streakBonus || 0,
      rewards: bonuses.breakdown,
      level: progressionUpdate.level,
    };
  }

  protected abstract calculateBaseXp(): number;
  protected abstract calculateBonuses(metadata: Record<string, any>): {
    totalBonus: number;
    breakdown: Record<string, number>;
  };

  private async recordActivity(userId: string, xpGained: number, metadata: Record<string, any>) {
    const activityRef = this.db
      .collection(Collections.UserStats)
      .doc(userId)
      .collection(Collections.UserStats_Activities)
      .doc();

    await activityRef.set({
      timestamp: FieldValue.serverTimestamp(),
      actionType: this.actionType,
      xpGained,
      metadata,
      createdAt: getCurrentTimeAsISO(),
    });
  }
}
