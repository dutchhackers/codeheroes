import { getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { Collections, GameActionType } from '@codeheroes/shared/types';
import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { ActionResult, GameAction } from '../../core/interfaces/action';
import { ProgressionService } from '../../core/progression/progression.service';
import { ActivityService } from '../../core/activity/activity.service';
import { ActivityCounters } from '../../core/interfaces/activity';

export abstract class BaseActionHandler {
  protected abstract actionType: GameActionType;
  private progressionService: ProgressionService;
  private activityService: ActivityService;

  constructor(protected db: Firestore) {
    this.progressionService = new ProgressionService();
    this.activityService = new ActivityService();
  }

  protected getCounterUpdates(): Record<string, any> {
    const updates: Record<string, any> = {
      countersLastUpdated: getCurrentTimeAsISO(),
    };

    switch (this.actionType) {
      case 'code_push':
        updates['counters.codePushes'] = FieldValue.increment(1);
        break;
      case 'pull_request_create':
        updates['counters.pullRequests.created'] = FieldValue.increment(1);
        updates['counters.pullRequests.total'] = FieldValue.increment(1);
        break;
      case 'pull_request_merge':
        updates['counters.pullRequests.merged'] = FieldValue.increment(1);
        updates['counters.pullRequests.total'] = FieldValue.increment(1);
        break;
      case 'pull_request_close':
        updates['counters.pullRequests.closed'] = FieldValue.increment(1);
        updates['counters.pullRequests.total'] = FieldValue.increment(1);
        break;
    }

    return updates;
  }

  protected async initializeCountersIfNeeded(userRef: FirebaseFirestore.DocumentReference) {
    const statsRef = userRef.collection(Collections.Stats).doc('current');
    const statsDoc = await statsRef.get();

    if (!statsDoc.exists || !statsDoc.data()?.counters) {
      const initialCounters: ActivityCounters = {
        pullRequests: {
          created: 0,
          merged: 0,
          closed: 0,
          total: 0,
        },
        codePushes: 0,
        codeReviews: 0,
      };

      await statsRef.set(
        {
          counters: initialCounters,
          countersLastUpdated: getCurrentTimeAsISO(),
        },
        { merge: true },
      );
    }
  }

  async handle(action: GameAction): Promise<ActionResult> {
    const { userId, metadata } = action;
    logger.info(`Starting action handler for ${this.actionType}`, { userId, metadata });

    // Initialize counters if needed
    const userRef = this.db.collection(Collections.Users).doc(userId);
    await this.initializeCountersIfNeeded(userRef);

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

    // Get counter updates
    const counterUpdates = this.getCounterUpdates();

    // Record activity and update counters using ActivityService
    const now = getCurrentTimeAsISO();
    const activityRef = userRef.collection(Collections.Activities).doc();

    // Update both activity and counters in a transaction
    await this.db.runTransaction(async (transaction) => {
      const statsRef = userRef.collection(Collections.Stats).doc('current');

      // Update counters
      transaction.update(statsRef, counterUpdates);

      // Record activity
      transaction.set(activityRef, {
        id: activityRef.id,
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
        createdAt: now,
        updatedAt: now,
      });
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
}
