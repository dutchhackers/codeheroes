import { DatabaseInstance, DatabaseService, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { GithubPullRequestEventData, GithubPushEventData } from '@codeheroes/providers';
import { Collections } from '@codeheroes/shared/types';
import { Firestore } from 'firebase-admin/firestore';
import { getRecentDailyIds, getRecentWeeklyIds, getTimeFrameIds } from '../../utils/time-frame.utils';
import { ProgressionEventType } from '../events/event-types';
import { UnifiedEventHandlerService } from '../events/unified-event-handler.service';
import { GameAction } from '../interfaces/action';
import { Activity, ActivityCounters, ActivityStats } from '../interfaces/activity';
import { TimeBasedActivityStats, TimeBasedStatsQuery } from '../interfaces/time-based-activity';

export class ActivityService {
  private db: Firestore;
  private databaseService: DatabaseService;
  private eventHandler: UnifiedEventHandlerService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.databaseService = new DatabaseService();
    this.eventHandler = new UnifiedEventHandlerService();
  }

  private getInitialCounters(): ActivityCounters {
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
        type: activity.type,
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

  async handleNewEvent(event: Event): Promise<GameAction | null> {
    try {
      switch (event.provider) {
        case 'github':
          return await this.handleGithubEvent(event);
        default:
          return null;
      }
    } catch (error) {
      logger.error('Error handling event:', error);
      return null;
    }
  }

  private async handleGithubEvent(event: Event): Promise<GameAction | null> {
    const userId = await this.databaseService.lookupUserId({
      sender: (event.data as any)?.sender,
      repository: (event.data as any)?.repository,
    });

    if (!userId) {
      logger.warn('No matching user found for GitHub event', {
        eventType: event.source.event,
      });
      return null;
    }

    switch (event.source.event) {
      case 'push':
        return this.handlePushEvent(event, userId);
      case 'pull_request':
        return this.handlePullRequestEvent(event, userId);
      case 'pull_request_review':
        return this.handlePullRequestReviewEvent(event, userId);
      default:
        return null;
    }
  }

  private handlePushEvent(event: Event, userId: string): GameAction | null {
    const data = event.data as GithubPushEventData;
    if (!data?.commits?.length) return null;

    return {
      userId,
      actionType: 'code_push',
      metadata: {
        commits: data.commits.length,
      },
    };
  }

  private handlePullRequestEvent(event: Event, userId: string): GameAction | null {
    const data = event.data as GithubPullRequestEventData;
    if (!data?.metrics || !data.action) return null;

    const metrics = {
      additions: data.metrics.additions,
      deletions: data.metrics.deletions,
      changedFiles: data.metrics.changedFiles,
    };

    switch (data.action) {
      case 'opened':
        return {
          userId,
          actionType: 'pull_request_create',
          metadata: metrics,
        };
      case 'closed':
        return {
          userId,
          actionType: data.merged ? 'pull_request_merge' : 'pull_request_close',
          metadata: metrics,
        };
      default:
        return null;
    }
  }

  private handlePullRequestReviewEvent(event: Event, userId: string): GameAction | null {
    const data = event.data as any;
    if (!data.action) return null;

    // Only process completed reviews
    if (data.action !== 'submitted') return null;

    const metadata = {
      commentCount: 0, // to be implemented later,
      filesReviewed: 0, // data.pull_request?.changed_files || 1,
      suggestions: 0, // to be implemented later
      state: data.review?.state,
    };

    return {
      userId,
      actionType: 'code_review_submit',
      metadata,
    };
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
    const timeframeId = date || getTimeFrameIds().daily;
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
    const timeframeId = weekId || getTimeFrameIds().weekly;
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
