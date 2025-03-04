import { DatabaseInstance, getCurrentTimeAsISO } from '@codeheroes/common';
import {
  Activity,
  ActivityCounters,
  ActivityStats,
  Collections,
  ProgressionEventType,
  TimeBasedActivityStats,
  TimeBasedStatsQuery,
} from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { getRecentDailyIds, getRecentWeeklyIds, getTimePeriodIds } from '../../utils/time-periods.utils';
import { EventProcessorService } from '../../events/event-processor.service';

export class ActivityService {
  private db: Firestore;
  private eventHandler: EventProcessorService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.eventHandler = new EventProcessorService();
  }

  private getInitialCounters(): ActivityCounters {
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

  private getInitialStats(): ActivityStats {
    return {
      counters: this.getInitialCounters(),
      countersLastUpdated: new Date().toISOString(),
    };
  }

  async trackActivity(activity: Activity): Promise<void> {
    const userRef = this.db.collection(Collections.Users).doc(activity.userId);
    const statsRef = userRef.collection(Collections.Stats).doc('current');
    const activityRef = userRef.collection(Collections.Activities).doc(activity.id);

    await this.db.runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      const currentStats = (statsDoc.exists ? statsDoc.data() : null) as ActivityStats | null;

      // Initialize stats if they don't exist
      const newStats = currentStats || this.getInitialStats();

      // Update last activity
      newStats.lastActivity = {
        type: activity.sourceActionType, // Use sourceActionType instead of type
        timestamp: activity.updatedAt,
      };

      // Create or update user stats document
      if (!statsDoc.exists) {
        transaction.set(statsRef, {
          userId: activity.userId,
          ...newStats,
          createdAt: activity.createdAt,
          updatedAt: activity.updatedAt,
        });
      } else {
        transaction.update(statsRef, {
          lastActivity: newStats.lastActivity,
          updatedAt: activity.updatedAt,
        });
      }

      // Record the activity
      transaction.set(activityRef, activity);
    });

    // Send event to unified handler
    await this.eventHandler.handleEvent({
      userId: activity.userId,
      timestamp: activity.updatedAt,
      type: ProgressionEventType.ACTIVITY_RECORDED,
      data: { activity },
    });
  }

  async getActivityStats(userId: string): Promise<ActivityStats> {
    const statsDoc = await this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Stats)
      .doc('current')
      .get();

    const stats = (statsDoc.data() as ActivityStats) || this.getInitialStats();

    // Ensure counters exist
    if (!stats.counters) {
      stats.counters = this.getInitialCounters();
      stats.countersLastUpdated = new Date().toISOString();

      // Update the document with initialized counters
      await statsDoc.ref.set(stats, { merge: true });
    }

    return stats;
  }

  async getRecentActivities(userId: string, limit = 10): Promise<Activity[]> {
    const snapshot = await this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Activities)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as Activity);
  }

  async getDailyActivityStats(userId: string, date?: string): Promise<TimeBasedActivityStats | null> {
    const timeframeId = date || getTimePeriodIds().daily;
    const statsRef = this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection('activityStats')
      .doc('daily')
      .collection('records')
      .doc(timeframeId);

    const doc = await statsRef.get();
    return doc.exists ? (doc.data() as TimeBasedActivityStats) : null;
  }

  async getWeeklyActivityStats(userId: string, weekId?: string): Promise<TimeBasedActivityStats | null> {
    const timeframeId = weekId || getTimePeriodIds().weekly;
    const statsRef = this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection('activityStats')
      .doc('weekly')
      .collection('records')
      .doc(timeframeId);

    const doc = await statsRef.get();
    return doc.exists ? (doc.data() as TimeBasedActivityStats) : null;
  }

  async getRecentDailyStats(userId: string, days = 7): Promise<TimeBasedActivityStats[]> {
    const dailyIds = getRecentDailyIds(days);
    const userRef = this.db.collection(Collections.Users).doc(userId);
    const dailyStatsRef = userRef.collection('activityStats').doc('daily').collection('records');

    const statsPromises = dailyIds.map(async (id) => {
      const doc = await dailyStatsRef.doc(id).get();
      return doc.exists ? (doc.data() as TimeBasedActivityStats) : null;
    });

    const stats = await Promise.all(statsPromises);
    return stats.filter((stat): stat is TimeBasedActivityStats => stat !== null);
  }

  async getRecentWeeklyStats(userId: string, weeks = 4): Promise<TimeBasedActivityStats[]> {
    const weeklyIds = getRecentWeeklyIds(weeks);
    const userRef = this.db.collection(Collections.Users).doc(userId);
    const weeklyStatsRef = userRef.collection('activityStats').doc('weekly').collection('records');

    const statsPromises = weeklyIds.map(async (id) => {
      const doc = await weeklyStatsRef.doc(id).get();
      return doc.exists ? (doc.data() as TimeBasedActivityStats) : null;
    });

    const stats = await Promise.all(statsPromises);
    return stats.filter((stat): stat is TimeBasedActivityStats => stat !== null);
  }

  async getTimeBasedActivityStats(userId: string, query: TimeBasedStatsQuery): Promise<TimeBasedActivityStats[]> {
    const userRef = this.db.collection(Collections.Users).doc(userId);
    const dailyStatsRef = userRef.collection('activityStats').doc('daily').collection('records');

    let statsQuery = dailyStatsRef.orderBy('timeframeId', 'desc');

    if (query.startDate) {
      statsQuery = statsQuery.where('timeframeId', '>=', query.startDate);
    }
    if (query.endDate) {
      statsQuery = statsQuery.where('timeframeId', '<=', query.endDate);
    }
    if (query.limit) {
      statsQuery = statsQuery.limit(query.limit);
    }

    const snapshot = await statsQuery.get();
    return snapshot.docs.map((doc) => doc.data() as TimeBasedActivityStats);
  }

  // Helper method to initialize time-based stats document
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
}
