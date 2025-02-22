import { DatabaseInstance } from '@codeheroes/common';
import { Firestore } from 'firebase-admin/firestore';
import { Activity, ActivityStats, ActivityCounters } from '../interfaces/activity';
import { Event } from '@codeheroes/event';
import { GameAction } from '../interfaces/action';
import { UnifiedEventHandlerService } from '../events/unified-event-handler.service';
import { GithubEventHandler } from '../../events/handlers/github.handler';
import { ProgressionEventType } from '../events/event-types';
import { Collections } from '@codeheroes/shared/types';

export class ActivityService {
  private db: Firestore;
  private eventHandler: UnifiedEventHandlerService;
  private githubHandler: GithubEventHandler;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.eventHandler = new UnifiedEventHandlerService();
    this.githubHandler = new GithubEventHandler();
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
        timestamp: activity.timestamp,
      };

      // Create or update user stats document
      if (!statsDoc.exists) {
        transaction.set(statsRef, {
          userId: activity.userId,
          ...newStats,
          createdAt: activity.timestamp,
          updatedAt: activity.timestamp,
        });
      } else {
        transaction.update(statsRef, {
          lastActivity: newStats.lastActivity,
          updatedAt: activity.timestamp,
        });
      }

      // Record the activity
      transaction.set(activityRef, activity);
    });

    // Send event to unified handler
    await this.eventHandler.handleEvent({
      userId: activity.userId,
      timestamp: activity.timestamp,
      type: ProgressionEventType.ACTIVITY_RECORDED,
      data: { activity },
    });
  }

  async handleNewEvent(event: Event): Promise<GameAction | null> {
    try {
      switch (event.provider) {
        case 'github':
          return await this.githubHandler.handleEvent(event);
        default:
          return null;
      }
    } catch (error) {
      console.error('Error handling event:', error);
      return null;
    }
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
