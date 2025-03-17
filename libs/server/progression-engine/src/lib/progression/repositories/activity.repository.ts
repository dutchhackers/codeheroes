import { DatabaseInstance, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { Activity, Collections, TimeBasedActivityStats } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { getTimePeriodIds } from '../../utils/time-periods.utils';

/**
 * Repository for managing user activities in Firestore
 */
export class ActivityRepository {
  private db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  /**
   * Records a new activity for a user
   * @param activity The activity to record
   * @returns The created activity with ID
   */
  async recordActivity(activity: Omit<Activity, 'id'>): Promise<Activity> {
    logger.debug('Recording activity', {
      userId: activity.userId,
      type: activity.sourceActionType,
    });

    try {
      const userRef = this.db.collection(Collections.Users).doc(activity.userId);
      const activityRef = userRef.collection(Collections.Activities).doc();

      const now = getCurrentTimeAsISO();
      const newActivity: Activity = {
        ...(activity as Activity),
        id: activityRef.id,
        createdAt: activity.createdAt || now,
        updatedAt: now,
      };

      await activityRef.set(newActivity);

      logger.debug('Activity recorded successfully', {
        activityId: newActivity.id,
        userId: activity.userId,
      });

      return newActivity;
    } catch (error) {
      logger.error('Error recording activity', {
        userId: activity.userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Gets recent activities for a user
   * @param userId User ID to get activities for
   * @param limit Maximum number of activities to return
   * @returns Array of activities ordered by createdAt (newest first)
   */
  async getRecentActivities(userId: string, limit = 10): Promise<Activity[]> {
    try {
      const snapshot = await this.db
        .collection(Collections.Users)
        .doc(userId)
        .collection(Collections.Activities)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as Activity);
    } catch (error) {
      logger.error('Error getting recent activities', { userId, error });
      throw error;
    }
  }

  /**
   * Gets daily activity stats for a user
   * @param userId User ID to get stats for
   * @param date Optional date string (YYYY-MM-DD), defaults to today
   * @returns The daily activity stats or null if not found
   */
  async getDailyStats(userId: string, date?: string): Promise<TimeBasedActivityStats | null> {
    const timeframeId = date || getTimePeriodIds().daily;

    try {
      const statsRef = this.db
        .collection(Collections.Users)
        .doc(userId)
        .collection('activityStats')
        .doc('daily')
        .collection('records')
        .doc(timeframeId);

      const doc = await statsRef.get();

      return doc.exists ? (doc.data() as TimeBasedActivityStats) : null;
    } catch (error) {
      logger.error('Error getting daily stats', { userId, date, error });
      throw error;
    }
  }

  /**
   * Gets weekly activity stats for a user
   * @param userId User ID to get stats for
   * @param weekId Optional week identifier (YYYY-WXX), defaults to current week
   * @returns The weekly activity stats or null if not found
   */
  async getWeeklyStats(userId: string, weekId?: string): Promise<TimeBasedActivityStats | null> {
    const timeframeId = weekId || getTimePeriodIds().weekly;

    try {
      const statsRef = this.db
        .collection(Collections.Users)
        .doc(userId)
        .collection('activityStats')
        .doc('weekly')
        .collection('records')
        .doc(timeframeId);

      const doc = await statsRef.get();

      return doc.exists ? (doc.data() as TimeBasedActivityStats) : null;
    } catch (error) {
      logger.error('Error getting weekly stats', { userId, weekId, error });
      throw error;
    }
  }
}
