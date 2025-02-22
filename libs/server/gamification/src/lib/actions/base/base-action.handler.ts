import { getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { Collections, GameActionType } from '@codeheroes/shared/types';
import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { ActionResult, GameAction } from '../../core/interfaces/action';
import { ProgressionService } from '../../core/progression/progression.service';
import { ActivityService } from '../../core/activity/activity.service';

export abstract class BaseActionHandler {
  protected abstract actionType: GameActionType;
  private progressionService: ProgressionService;
  private activityService: ActivityService;

  constructor(protected db: Firestore) {
    this.progressionService = new ProgressionService();
    this.activityService = new ActivityService();
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

    // Record activity using ActivityService
    const now = getCurrentTimeAsISO();
    await this.activityService.trackActivity({
      id: this.generateActivityId(),
      userId,
      type: this.actionType,
      metadata: {
        ...metadata,
        level: progressionUpdate.level,
        bonuses: bonuses.breakdown,
      },
      xp: {
        earned: totalXP,
        breakdown: [
          { type: 'base', amount: baseXP, description: 'Base XP' },
          ...Object.entries(bonuses.breakdown).map(([type, amount]) => ({
            type,
            amount,
            description: `${type} bonus`,
          })),
        ],
      },
      timestamp: now,
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

  private generateActivityId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
