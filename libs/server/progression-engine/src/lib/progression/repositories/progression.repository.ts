import { BaseRepository, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { ActivityCounters, Collections } from '@codeheroes/types';
import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { getXpProgress } from '../../config/level-thresholds';
import { getTimePeriodIds } from '../../utils/time-periods.utils';
import { ProgressionState, ProgressionUpdate, ProgressionUpdateResult } from '../core/progression-state.model';

/**
 * Interface representing a plan for transaction execution
 */
interface TransactionPlan {
  needsInitialization: boolean;
  userId?: string;
  update?: ProgressionUpdate;
  activity?: any;
  writes?: {
    stats: any;
    daily: any;
    weekly: any;
    activity: any;
  };
  result?: {
    state: ProgressionState;
    previousState: ProgressionState;
    leveledUp: boolean;
    newAchievements: string[];
  };
}

/**
 * Repository for managing user progression state in Firestore
 */
export class ProgressionRepository extends BaseRepository<ProgressionState> {
  protected collectionPath = Collections.Stats;

  constructor(db: Firestore) {
    super(db);
  }

  /**
   * Get user progression state
   */
  async getState(userId: string): Promise<ProgressionState | null> {
    logger.debug('Getting progression state', { userId });

    try {
      const statsDoc = await this.db
        .collection(Collections.Users)
        .doc(userId)
        .collection(Collections.Stats)
        .doc('current')
        .get();

      if (!statsDoc.exists) {
        logger.debug('No progression state found, returning null', { userId });
        return null;
      }

      const userStats = statsDoc.data()!;
      const { currentLevel, currentLevelXp, xpToNextLevel } = getXpProgress(userStats.xp || 0);

      return {
        id: userId, // Add this line
        userId,
        xp: userStats.xp || 0,
        level: currentLevel,
        currentLevelXp,
        xpToNextLevel,
        lastActivityDate: userStats.lastActivityDate || null,
        counters: userStats.counters || this.getInitialCounters(),
        countersLastUpdated: userStats.countersLastUpdated || getCurrentTimeAsISO(),
        achievements: userStats.achievements || [],
      };
    } catch (error) {
      logger.error('Error retrieving progression state', { userId, error });
      throw error;
    }
  }

  /**
   * Update user progression state
   */
  async updateState(userId: string, update: ProgressionUpdate, activity?: any): Promise<ProgressionUpdateResult> {
    logger.info('Updating progression state', { userId, xpGained: update.xpGained });

    // Get all the references we'll need
    const userRef = this.db.collection(Collections.Users).doc(userId);
    const statsRef = userRef.collection(Collections.Stats).doc('current');
    const timeFrames = getTimePeriodIds();
    const dailyStatsRef = userRef.collection('activityStats').doc('daily').collection('records').doc(timeFrames.daily);
    const weeklyStatsRef = userRef
      .collection('activityStats')
      .doc('weekly')
      .collection('records')
      .doc(timeFrames.weekly);

    // First get all data we need for planning
    try {
      const [statsDoc, dailyDoc, weeklyDoc] = await Promise.all([
        statsRef.get(),
        dailyStatsRef.get(),
        weeklyStatsRef.get(),
      ]);

      // If state doesn't exist, initialize it first
      if (!statsDoc.exists) {
        const initialState = await this.createInitialState(userId);
        return this.updateState(userId, update, activity);
      }

      // Create our transaction plan
      const plan = this.createTransactionPlan({
        userId,
        update,
        activity,
        statsDoc: statsDoc.data(),
        dailyDoc: dailyDoc.exists ? dailyDoc.data() : null,
        weeklyDoc: weeklyDoc.exists ? weeklyDoc.data() : null,
        timeFrames,
      });

      // Execute the transaction with this plan
      return this.executeStateUpdateTransaction(plan, {
        statsRef,
        dailyStatsRef,
        weeklyStatsRef,
        userRef,
      });
    } catch (error) {
      logger.error('Error updating progression state', { userId, error });
      throw error;
    }
  }

  /**
   * Create initial progression state for a new user
   */
  async createInitialState(userId: string): Promise<ProgressionState> {
    logger.debug('Creating initial progression state', { userId });

    const now = getCurrentTimeAsISO();
    const initialCounters = this.getInitialCounters();

    const initialState: ProgressionState = {
      id: userId, // Add this line
      userId,
      xp: 0,
      level: 1,
      currentLevelXp: 0,
      xpToNextLevel: 1000,
      lastActivityDate: null,
      counters: initialCounters,
      countersLastUpdated: now,
      achievements: [],
    };

    try {
      const userRef = this.db.collection(Collections.Users).doc(userId);
      const statsRef = userRef.collection(Collections.Stats).doc('current');

      await statsRef.set({
        ...initialState,
        createdAt: now,
        updatedAt: now,
      });

      logger.debug('Initial progression state created', { userId });
      return initialState;
    } catch (error) {
      logger.error('Error creating initial progression state', { userId, error });
      throw error;
    }
  }

  /**
   * Creates a transaction plan using pre-gathered data
   * This separates the business logic from the actual transaction execution
   */
  private createTransactionPlan({
    userId,
    update,
    activity,
    statsDoc,
    dailyDoc,
    weeklyDoc,
    timeFrames,
  }): TransactionPlan {
    // Handle missing state
    if (!statsDoc) {
      return {
        needsInitialization: true,
        userId,
        update,
        activity,
      };
    }

    // Calculate new state
    const currentState = statsDoc as ProgressionState;
    const previousState = { ...currentState };
    const newState = this.calculateNewState(currentState, update);

    // Determine if user leveled up
    const leveledUp = newState.level > previousState.level;

    // Prepare activity data for time-based stats
    const activityData = update.activityType
      ? {
          type: update.activityType,
          timestamp: getCurrentTimeAsISO(),
        }
      : undefined;

    // Prepare writes for each document
    const writes = {
      stats: {
        data: newState,
        merge: true,
      },
      daily: this.prepareTimeframeWrite(dailyDoc, timeFrames.daily, update, activityData),
      weekly: this.prepareTimeframeWrite(weeklyDoc, timeFrames.weekly, update, activityData),
      activity: activity
        ? {
            data: {
              ...activity,
              createdAt: activity.createdAt || getCurrentTimeAsISO(),
              updatedAt: getCurrentTimeAsISO(),
            },
          }
        : null,
    };

    return {
      needsInitialization: false,
      writes,
      result: {
        state: newState,
        previousState,
        leveledUp,
        newAchievements: update.achievements || [],
      },
    };
  }

  /**
   * Executes the transaction using the prepared plan
   */
  private async executeStateUpdateTransaction(
    plan: TransactionPlan,
    refs: {
      statsRef: FirebaseFirestore.DocumentReference;
      dailyStatsRef: FirebaseFirestore.DocumentReference;
      weeklyStatsRef: FirebaseFirestore.DocumentReference;
      userRef: FirebaseFirestore.DocumentReference;
    },
  ): Promise<ProgressionUpdateResult> {
    // If initialization is needed, handle specially
    if (plan.needsInitialization) {
      const initialState = await this.createInitialState(plan.userId!);
      return this.updateState(plan.userId!, plan.update!, plan.activity);
    }

    return this.executeTransaction(async (transaction) => {
      // Read all documents again to verify they haven't changed
      const freshStatsDoc = await transaction.get(refs.statsRef);

      // Apply stats update
      if (plan.writes?.stats) {
        transaction.set(refs.statsRef, plan.writes.stats.data, { merge: true });
      }

      // Apply daily stats update
      if (plan.writes?.daily) {
        if (!plan.writes.daily.exists) {
          transaction.set(refs.dailyStatsRef, plan.writes.daily.data);
        } else {
          transaction.update(refs.dailyStatsRef, plan.writes.daily.updates);
        }
      }

      // Apply weekly stats update
      if (plan.writes?.weekly) {
        if (!plan.writes.weekly.exists) {
          transaction.set(refs.weeklyStatsRef, plan.writes.weekly.data);
        } else {
          transaction.update(refs.weeklyStatsRef, plan.writes.weekly.updates);
        }
      }

      // Record activity if provided
      if (plan.writes?.activity && plan.activity) {
        const activityRef = refs.userRef
          .collection(Collections.Activities)
          .doc(plan.activity.id || `activity_${Date.now()}`);
        transaction.set(activityRef, plan.writes.activity.data);
      }

      return plan.result!;
    });
  }

  /**
   * Calculate the new state based on the current state and update
   */
  private calculateNewState(currentState: ProgressionState, update: ProgressionUpdate): ProgressionState {
    const newXp = currentState.xp + update.xpGained;
    const { currentLevel, currentLevelXp, xpToNextLevel } = getXpProgress(newXp);

    const newState = { ...currentState };
    newState.xp = newXp;
    newState.level = currentLevel;
    newState.currentLevelXp = currentLevelXp;
    newState.xpToNextLevel = xpToNextLevel;
    newState.lastActivityDate = new Date().toISOString().split('T')[0];
    newState.countersLastUpdated = getCurrentTimeAsISO();

    // Update counters
    if (update.activityType) {
      this.updateStateCounters(newState, update.activityType);
    }

    return newState;
  }

  /**
   * Update the counters in the state object based on activity type
   */
  private updateStateCounters(state: ProgressionState, activityType: string): void {
    if (!state.counters) {
      state.counters = this.getInitialCounters();
    }

    if (state.counters.actions[activityType] !== undefined) {
      state.counters.actions[activityType]++;
    }
  }

  /**
   * Prepare a write operation for a timeframe document (daily/weekly)
   */
  private prepareTimeframeWrite(doc: any, timeframeId: string, update: ProgressionUpdate, activityData?: any) {
    if (!doc) {
      // New document case
      return {
        exists: false,
        data: {
          timeframeId,
          xpGained: update.xpGained,
          counters: this.getInitialCounters(),
          countersLastUpdated: getCurrentTimeAsISO(),
          lastActivity: activityData,
        },
      };
    } else {
      // Update existing document case
      const updates: any = {
        xpGained: FieldValue.increment(update.xpGained),
        countersLastUpdated: getCurrentTimeAsISO(),
        lastActivity: activityData,
      };

      if (update.activityType) {
        updates[`counters.actions.${update.activityType}`] = FieldValue.increment(1);
      }

      return {
        exists: true,
        updates,
      };
    }
  }

  /**
   * Gets initial empty counters structure
   * @returns Empty counters object
   */
  private getInitialCounters(): ActivityCounters {
    return {
      actions: {
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
}
