import { getCurrentTimeAsISO, logger } from '@codeheroes/common';
import {
  ActionResult,
  ActivityCounters,
  ActivityIconType,
  Collections,
  GameAction,
  GameActionContext,
  GameActionMetrics,
  GameActionType,
  TimeBasedActivityStats,
  PullRequestContext,
  CodePushContext,
  CodeReviewContext,
  Activity,
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

      // Generate UI-friendly display information
      const displayInfo = this.generateDisplayInfo(action);

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
          // Add UI-friendly display information
          display: displayInfo,
          metadata: {
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

  /**
   * Generate UI-friendly display information from the GameAction
   */
  protected generateDisplayInfo(action: GameAction): {
    title: string;
    description: string;
    url?: string;
    iconType: ActivityIconType | GameActionType;
    additionalInfo?: Record<string, any>;
  } {
    let title = '';
    let description = '';
    let url = '';
    let iconType: ActivityIconType | GameActionType = this.actionType;
    const additionalInfo: Record<string, any> = {};

    // Extract repository information
    if ('repository' in action.context) {
      additionalInfo.repositoryName = action.context.repository.name;
      additionalInfo.repositoryOwner = action.context.repository.owner;
    }

    // Generate appropriate titles and descriptions based on action type
    switch (action.type) {
      case 'code_push': {
        const context = action.context as CodePushContext;
        const commitCount = context.commits.length;
        const branch = context.branch;

        title = `Pushed ${commitCount} commit${commitCount > 1 ? 's' : ''} to ${branch}`;

        // Use the last commit message for description
        if (commitCount > 0) {
          description = context.commits[0].message;
          additionalInfo.commitId = context.commits[0].id;
          additionalInfo.commitCount = commitCount;
        }

        iconType = ActivityIconType.PUSH;
        break;
      }
      case 'pull_request_create': {
        const context = action.context as PullRequestContext;
        title = `Created PR: ${context.pullRequest.title}`;
        description = '';

        if (additionalInfo.repositoryName && additionalInfo.repositoryOwner) {
          url = `https://github.com/${additionalInfo.repositoryOwner}/${additionalInfo.repositoryName}/pull/${context.pullRequest.number}`;
        }

        additionalInfo.prNumber = context.pullRequest.number;
        additionalInfo.branch = context.pullRequest.branch;
        additionalInfo.baseBranch = context.pullRequest.baseBranch;

        iconType = ActivityIconType.PR_CREATE;
        break;
      }
      case 'pull_request_merge': {
        const context = action.context as PullRequestContext;
        title = `Merged PR: ${context.pullRequest.title}`;
        description = '';

        if (additionalInfo.repositoryName && additionalInfo.repositoryOwner) {
          url = `https://github.com/${additionalInfo.repositoryOwner}/${additionalInfo.repositoryName}/pull/${context.pullRequest.number}`;
        }

        additionalInfo.prNumber = context.pullRequest.number;
        additionalInfo.branch = context.pullRequest.branch;
        additionalInfo.baseBranch = context.pullRequest.baseBranch;

        iconType = ActivityIconType.PR_MERGE;
        break;
      }
      case 'pull_request_close': {
        const context = action.context as PullRequestContext;
        title = `Closed PR: ${context.pullRequest.title}`;
        description = '';

        if (additionalInfo.repositoryName && additionalInfo.repositoryOwner) {
          url = `https://github.com/${additionalInfo.repositoryOwner}/${additionalInfo.repositoryName}/pull/${context.pullRequest.number}`;
        }

        additionalInfo.prNumber = context.pullRequest.number;
        additionalInfo.branch = context.pullRequest.branch;
        additionalInfo.baseBranch = context.pullRequest.baseBranch;

        iconType = ActivityIconType.PR_CLOSE;
        break;
      }
      case 'code_review_submit': {
        const context = action.context as CodeReviewContext;
        const state = context.review.state;

        title = `Reviewed PR: ${context.pullRequest.title}`;
        description = `${state.charAt(0).toUpperCase() + state.slice(1)} the pull request`;

        if (additionalInfo.repositoryName && additionalInfo.repositoryOwner) {
          url = `https://github.com/${additionalInfo.repositoryOwner}/${additionalInfo.repositoryName}/pull/${context.pullRequest.number}`;
        }

        additionalInfo.prNumber = context.pullRequest.number;
        additionalInfo.reviewState = state;

        iconType = ActivityIconType.REVIEW;
        break;
      }
      default:
        title = `${action.type.replace(/_/g, ' ')}`;
        description = '';
        iconType = action.type;
    }

    return {
      title,
      description,
      url,
      iconType,
      additionalInfo,
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
