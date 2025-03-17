import { DatabaseInstance, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { Collections, ActivityCounters } from '@codeheroes/types';
import { Firestore, FieldValue } from 'firebase-admin/firestore';
import { getXpProgress } from '../../config/level-thresholds';
import { ProgressionState, ProgressionUpdate, ProgressionUpdateResult } from '../core/progression-state.model';
import { getTimePeriodIds } from '../../utils/time-periods.utils';

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
export class ProgressionStateRepository {
  private db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  /**
   * Retrieves the current progression state for a user
   * @param userId User ID to get state for
   * @returns The current progression state or null if not found
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
   * Updates a user's progression state with new XP and activity data
   * @param userId User ID to update
   * @param update The progression update data
   * @param activity Optional activity to record
   * @returns Updated progression state
   */
  async updateState(userId: string, update: ProgressionUpdate, activity?: any): Promise<ProgressionUpdateResult> {
    logger.info('Updating progression state', { userId, xpGained: update.xpGained });

    // Get references to all documents we'll need
    const userRef = this.db.collection(Collections.Users).doc(userId);
    const statsRef = userRef.collection(Collections.Stats).doc('current');
    const timeFrames = getTimePeriodIds();
    const dailyStatsRef = userRef.collection('activityStats').doc('daily').collection('records').doc(timeFrames.daily);
    const weeklyStatsRef = userRef
      .collection('activityStats')
      .doc('weekly')
      .collection('records')
      .doc(timeFrames.weekly);

    // Pre-transaction: gather all data outside the transaction first
    const [statsDoc, dailyDoc, weeklyDoc] = await Promise.all([
      statsRef.get(),
      dailyStatsRef.get(),
      weeklyStatsRef.get(),
    ]);

    // Create a plan based on this data
    const plan = this.createTransactionPlan({
      userId,
      update,
      activity,
      statsDoc: statsDoc.exists ? statsDoc.data() : null,
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
  }

  /**
   * Creates an initial progression state for a new user
   * @param userId User ID to create state for
   * @returns The newly created progression state
   */
  async createInitialState(userId: string): Promise<ProgressionState> {
    logger.debug('Creating initial progression state', { userId });

    const now = getCurrentTimeAsISO();
    const initialCounters = this.getInitialCounters();

    const initialState: ProgressionState = {
      userId,
      xp: 0,
      level: 1,
      currentLevelXp: 0,
      xpToNextLevel: 1000, // Default first level requirement
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

    // Prepare planned writes
    const writes = {
      stats: {
        ref: 'statsRef',
        data: newState,
        merge: true,
      },
      daily: this.prepareTimeframeWrite(dailyDoc, timeFrames.daily, update),
      weekly: this.prepareTimeframeWrite(weeklyDoc, timeFrames.weekly, update),
      activity: activity
        ? {
            ref: `${Collections.Activities}/${activity.id || `activity_${Date.now()}`}`,
            data: {
              ...activity,
              createdAt: activity.createdAt || getCurrentTimeAsISO(),
              updatedAt: getCurrentTimeAsISO(),
            },
          }
        : null,
    };

    // Prepare result
    const leveledUp = newState.level > previousState.level;

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

    return this.db.runTransaction(async (transaction) => {
      // Read all documents again to verify they haven't changed
      const freshStatsDoc = await transaction.get(refs.statsRef);

      // Optional: Verify data is still valid or handle conflicts
      // This step could be expanded depending on your conflict resolution needs

      // Apply all writes from the plan
      for (const [key, write] of Object.entries(plan.writes!)) {
        if (!write) continue;

        // Get the right reference based on the key
        let ref;
        if (key === 'stats') ref = refs.statsRef;
        else if (key === 'daily') ref = refs.dailyStatsRef;
        else if (key === 'weekly') ref = refs.weeklyStatsRef;
        else if (key === 'activity') ref = refs.userRef.collection(Collections.Activities).doc(write.ref.split('/')[1]);
        else continue;

        // Apply the appropriate write operation
        if (write.merge) {
          transaction.set(ref, write.data, { merge: true });
        } else if (write.update) {
          transaction.update(ref, write.data);
        } else {
          transaction.set(ref, write.data);
        }
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
  private prepareTimeframeWrite(doc: any, timeframeId: string, update: ProgressionUpdate) {
    if (!doc) {
      // New document case
      return {
        data: {
          timeframeId,
          xpGained: update.xpGained,
          counters: this.getInitialCounters(),
          countersLastUpdated: getCurrentTimeAsISO(),
          lastActivity: update.activityType
            ? {
                type: update.activityType,
                timestamp: getCurrentTimeAsISO(),
              }
            : undefined,
        },
      };
    } else {
      // Update existing document case
      return {
        update: true,
        data: {
          xpGained: FieldValue.increment(update.xpGained),
          [`counters.actions.${update.activityType}`]: update.activityType ? FieldValue.increment(1) : undefined,
          countersLastUpdated: getCurrentTimeAsISO(),
          lastActivity: update.activityType
            ? {
                type: update.activityType,
                timestamp: getCurrentTimeAsISO(),
              }
            : undefined,
        },
      };
    }
  }
}
