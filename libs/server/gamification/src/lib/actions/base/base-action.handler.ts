import { getCurrentTimeAsISO, logger } from '@codeheroes/common';
import {
  ActionResult,
  ActivityCounters,
  Collections,
  GameAction,
  GameActionContext,
  GameActionMetrics,
  GameActionType,
  TimeBasedActivityStats,
} from '@codeheroes/shared/types';
import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { ProgressionService } from '../../core/progression/progression.service';
import { getTimeFrameIds } from '../../utils/time-frame.utils';

export abstract class BaseActionHandler {
  protected abstract actionType: GameActionType;
  private progressionService: ProgressionService;

  constructor(protected db: Firestore) {
    this.progressionService = new ProgressionService();
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
      case 'code_review_submit':
        updates['counters.codeReviews'] = FieldValue.increment(1);
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
    const { userId } = action;
    logger.info(`Starting action handler for ${this.actionType}`, { userId });

    const timeFrames = getTimeFrameIds();
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

      // Record activity
      writes.push(() =>
        transaction.set(activityRef, {
          id: activityRef.id,
          userId,
          type: this.actionType,
          metadata: {
            //...metadata,
            // TODO: metrics and context
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
      pullRequests: {
        created: 0,
        merged: 0,
        closed: 0,
        total: 0,
      },
      codePushes: 0,
      codeReviews: 0,
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
