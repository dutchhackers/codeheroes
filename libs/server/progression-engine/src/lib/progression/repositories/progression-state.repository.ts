import { DatabaseInstance, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { Collections, ActivityCounters } from '@codeheroes/types';
import { Firestore, FieldValue } from 'firebase-admin/firestore';
import { getXpProgress } from '../../config/level-thresholds';
import { ProgressionState, ProgressionUpdate, ProgressionUpdateResult } from '../core/progression-state.model';
import { getTimePeriodIds } from '../../utils/time-periods.utils';

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

    const timeFrames = getTimePeriodIds();
    const userRef = this.db.collection(Collections.Users).doc(userId);

    try {
      return await this.db.runTransaction(async (transaction) => {
        // STEP 1: Perform ALL reads first
        // Get current state within transaction
        const statsRef = userRef.collection(Collections.Stats).doc('current');
        const statsDoc = await transaction.get(statsRef);

        if (!statsDoc.exists) {
          // Initialize state if it doesn't exist
          const initialState = await this.createInitialState(userId);
          return this.updateState(userId, update, activity);
        }

        // Read daily stats
        const dailyStatsRef = userRef
          .collection('activityStats')
          .doc('daily')
          .collection('records')
          .doc(timeFrames.daily);
        const dailyDoc = await transaction.get(dailyStatsRef);

        // Read weekly stats
        const weeklyStatsRef = userRef
          .collection('activityStats')
          .doc('weekly')
          .collection('records')
          .doc(timeFrames.weekly);
        const weeklyDoc = await transaction.get(weeklyStatsRef);

        // STEP 2: Process data and prepare updates
        const currentState = statsDoc.data() as ProgressionState;

        // Store previous state for comparison
        const previousState = { ...currentState };

        // Apply XP update and calculate new level
        const newXp = currentState.xp + update.xpGained;
        const { currentLevel, currentLevelXp, xpToNextLevel } = getXpProgress(newXp);

        // Create new state
        const newState: ProgressionState = {
          ...currentState,
          xp: newXp,
          level: currentLevel,
          currentLevelXp,
          xpToNextLevel,
          lastActivityDate: new Date().toISOString().split('T')[0],
          countersLastUpdated: getCurrentTimeAsISO(),
        };

        // Update counters if activity type provided
        if (update.activityType) {
          if (!newState.counters) {
            newState.counters = this.getInitialCounters();
          }

          if (!newState.counters.actions[update.activityType]) {
            newState.counters.actions[update.activityType] = 0;
          }

          newState.counters.actions[update.activityType]++;
        }

        // Determine if user leveled up
        const leveledUp = currentLevel > previousState.level;

        // STEP 3: Perform ALL writes after ALL reads
        // Update state document
        transaction.set(statsRef, newState, { merge: true });

        // Update daily stats
        if (!dailyDoc.exists) {
          // Initialize daily stats if they don't exist
          transaction.set(dailyStatsRef, {
            timeframeId: timeFrames.daily,
            xpGained: update.xpGained,
            counters: this.getInitialCounters(),
            countersLastUpdated: getCurrentTimeAsISO(),
            lastActivity: update.activityType
              ? {
                  type: update.activityType,
                  timestamp: getCurrentTimeAsISO(),
                }
              : undefined,
          });
        } else {
          // Update existing daily stats
          transaction.update(dailyStatsRef, {
            xpGained: FieldValue.increment(update.xpGained),
            [`counters.actions.${update.activityType}`]: FieldValue.increment(1),
            countersLastUpdated: getCurrentTimeAsISO(),
            lastActivity: update.activityType
              ? {
                  type: update.activityType,
                  timestamp: getCurrentTimeAsISO(),
                }
              : undefined,
          });
        }

        // Update weekly stats
        if (!weeklyDoc.exists) {
          // Initialize weekly stats if they don't exist
          transaction.set(weeklyStatsRef, {
            timeframeId: timeFrames.weekly,
            xpGained: update.xpGained,
            counters: this.getInitialCounters(),
            countersLastUpdated: getCurrentTimeAsISO(),
            lastActivity: update.activityType
              ? {
                  type: update.activityType,
                  timestamp: getCurrentTimeAsISO(),
                }
              : undefined,
          });
        } else {
          // Update existing weekly stats
          transaction.update(weeklyStatsRef, {
            xpGained: FieldValue.increment(update.xpGained),
            [`counters.actions.${update.activityType}`]: FieldValue.increment(1),
            countersLastUpdated: getCurrentTimeAsISO(),
            lastActivity: update.activityType
              ? {
                  type: update.activityType,
                  timestamp: getCurrentTimeAsISO(),
                }
              : undefined,
          });
        }

        // Record activity if provided
        if (activity) {
          const activityRef = userRef.collection(Collections.Activities).doc(activity.id || `activity_${Date.now()}`);
          transaction.set(activityRef, {
            ...activity,
            createdAt: activity.createdAt || getCurrentTimeAsISO(),
            updatedAt: getCurrentTimeAsISO(),
          });
        }

        return {
          state: newState,
          previousState,
          leveledUp,
          newAchievements: update.achievements,
        };
      });
    } catch (error) {
      logger.error('Error updating progression state', { userId, error });
      throw error;
    }
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
}
