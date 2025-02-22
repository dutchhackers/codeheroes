import { DatabaseInstance, DatabaseService, logger } from '@codeheroes/common';
import { Firestore } from 'firebase-admin/firestore';
import { Activity, ActivityStats, ActivityCounters } from '../interfaces/activity';
import { Event } from '@codeheroes/event';
import { GameAction } from '../interfaces/action';
import { UnifiedEventHandlerService } from '../events/unified-event-handler.service';
import { ProgressionEventType } from '../events/event-types';
import { Collections } from '@codeheroes/shared/types';
import { GithubPullRequestEventData, GithubPushEventData } from '@codeheroes/providers';

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
}
