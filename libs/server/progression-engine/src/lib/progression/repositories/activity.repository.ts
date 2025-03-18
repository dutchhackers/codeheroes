import { BaseRepository, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { Activity, Collections, TimeBasedActivityStats } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { getTimePeriodIds } from '../../utils/time-periods.utils';

/**
 * Repository for managing user activities in Firestore
 */
export class ActivityRepository extends BaseRepository<Activity> {
  protected collectionPath = Collections.Activities;

  constructor(db: Firestore) {
    super(db);
  }

  /**
   * Record a new activity for a user
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
   * Get recent activities for a user
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
   * Get daily activity stats for a user
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
   * Get weekly activity stats for a user
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

  /**
   * Get activities by type for a user
   */
  async getActivitiesByType(userId: string, activityType: string, limit = 50): Promise<Activity[]> {
    try {
      const snapshot = await this.db
        .collection(Collections.Users)
        .doc(userId)
        .collection(Collections.Activities)
        .where('sourceActionType', '==', activityType)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as Activity);
    } catch (error) {
      logger.error('Error getting activities by type', { userId, activityType, error });
      throw error;
    }
  }

  /**
   * Count activities for a user
   */
  async countActivities(userId: string, activityType?: string): Promise<number> {
    try {
      // Start with a CollectionReference
      const collectionRef = this.db.collection(Collections.Users).doc(userId).collection(Collections.Activities);

      // Create a query from the CollectionReference
      let query = collectionRef as FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;

      // Apply the condition if needed
      if (activityType) {
        query = query.where('sourceActionType', '==', activityType);
      }

      // Execute the count
      const snapshot = await query.count().get();
      return snapshot.data().count;
    } catch (error) {
      logger.error('Error counting activities', { userId, activityType, error });
      throw error;
    }
  }
}
