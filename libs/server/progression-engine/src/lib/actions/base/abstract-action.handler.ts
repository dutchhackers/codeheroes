import { getCurrentTimeAsISO, logger } from '@codeheroes/common';
import {
  ActionResult,
  Activity,
  ActivityCounters,
  Collections,
  GameAction,
  GameActionContext,
  GameActionMetrics,
  GameActionType,
  TimeBasedActivityStats,
} from '@codeheroes/types';
import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { UserProgressionService } from '../../progression/services/user-progression.service';
import { getTimePeriodIds } from '../../utils/time-periods.utils';

export abstract class AbstractActionHandler {
  protected abstract actionType: GameActionType;
  private progressionService: UserProgressionService;

  constructor(protected db: Firestore) {
    this.progressionService = new UserProgressionService();
  }

  protected getCounterUpdates(): Record<string, any> {
    const updates: Record<string, any> = {
      countersLastUpdated: getCurrentTimeAsISO(),
    };

    // Simple update for the specific action type counter
    updates[`counters.actions.${this.actionType}`] = FieldValue.increment(1);

    return updates;
  }

  protected async initializeCountersIfNeeded(userRef: FirebaseFirestore.DocumentReference) {
    const statsRef = userRef.collection(Collections.Stats).doc('current');
    const statsDoc = await statsRef.get();

    if (!statsDoc.exists || !statsDoc.data()?.counters) {
      await statsRef.set(
        {
          counters: this.getInitialCounters(),
          countersLastUpdated: getCurrentTimeAsISO(),
        },
        { merge: true },
      );
    }
  }

  async handle(action: GameAction): Promise<ActionResult> {
    const { userId } = action;
    logger.info(`Starting action handler for ${this.actionType}`, { userId });

    const timeFrames = getTimePeriodIds();
    const userRef = this.db.collection(Collections.Users).doc(userId);
    await this.initializeCountersIfNeeded(userRef);

    const baseXP = this.calculateBaseXp();
    const bonuses = this.calculateBonuses(action.context, action.metrics);
    const totalXP = baseXP + bonuses.totalBonus;

    logger.info('XP calculation details', {
      actionType: this.actionType,
      userId,
      baseXP,
      bonuses: bonuses.breakdown,
      totalXP,
    });

    logger.info('Updating progression with calculated XP', { userId, totalXP });
    const progressionUpdate = await this.progressionService.updateProgression(userId, {
      xpGained: totalXP,
      activityType: this.actionType,
    });

    const counterUpdates = this.getCounterUpdates();
    const now = getCurrentTimeAsISO();

    const activityRef = userRef.collection(Collections.Activities).doc();
    const statsRef = userRef.collection(Collections.Stats).doc('current');
    const dailyStatsRef = userRef.collection('activityStats').doc('daily').collection('records').doc(timeFrames.daily);
    const weeklyStatsRef = userRef
      .collection('activityStats')
      .doc('weekly')
      .collection('records')
      .doc(timeFrames.weekly);

    await this.db.runTransaction(async (transaction) => {
      // First, perform all reads
      const [dailyDoc, weeklyDoc] = await Promise.all([
        transaction.get(dailyStatsRef),
        transaction.get(weeklyStatsRef),
      ]);

      // Prepare write operations
      const writes = [];

      // Update global counters
      writes.push(() => transaction.update(statsRef, counterUpdates));

      // Initialize and update daily stats
      if (!dailyDoc.exists) {
        writes.push(() => this.initializeTimeBasedStats(transaction, dailyStatsRef, timeFrames.daily));
      }
      writes.push(() =>
        transaction.update(dailyStatsRef, {
          ...counterUpdates,
          xpGained: FieldValue.increment(totalXP),
          countersLastUpdated: now,
          lastActivity: {
            type: this.actionType,
            timestamp: now,
          },
        }),
      );

      // Initialize and update weekly stats
      if (!weeklyDoc.exists) {
        writes.push(() => this.initializeTimeBasedStats(transaction, weeklyStatsRef, timeFrames.weekly));
      }
      writes.push(() =>
        transaction.update(weeklyStatsRef, {
          ...counterUpdates,
          xpGained: FieldValue.increment(totalXP),
          countersLastUpdated: now,
          lastActivity: {
            type: this.actionType,
            timestamp: now,
          },
        }),
      );

      // Record activity with enhanced display information
      writes.push(() =>
        transaction.set(activityRef, <Activity>{
          id: activityRef.id,
          userId,
          type: 'game-action',
          sourceActionType: this.actionType,
          // Store the complete context and metrics
          context: action.context,
          metrics: action.metrics,

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
        }),
      );

      // Execute all write operations after reads
      for (const write of writes) {
        write();
      }
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

  private async initializeTimeBasedStats(
    transaction: FirebaseFirestore.Transaction,
    docRef: FirebaseFirestore.DocumentReference,
    timeframeId: string,
  ): Promise<void> {
    const initialStats: TimeBasedActivityStats = {
      timeframeId,
      counters: this.getInitialCounters(),
      xpGained: 0,
      countersLastUpdated: getCurrentTimeAsISO(),
    };
    transaction.set(docRef, initialStats);
  }

  protected getInitialCounters(): ActivityCounters {
    return {
      actions: {
        // Initialize counters for all known action types to 0
        code_push: 0,
        pull_request_create: 0,
        pull_request_merge: 0,
        pull_request_close: 0,
        code_review_submit: 0,
        code_review_comment: 0,
        issue_create: 0,
        issue_close: 0,
        issue_reopen: 0,
        workout_complete: 0,
        distance_milestone: 0,
        speed_record: 0,
      },
    };
  }

  protected abstract calculateBaseXp(): number;
  protected abstract calculateBonuses(
    context: GameActionContext,
    metrics: GameActionMetrics,
  ): {
    totalBonus: number;
    breakdown: Record<string, number>;
  };
}
