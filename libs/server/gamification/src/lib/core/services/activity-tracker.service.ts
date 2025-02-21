import { DatabaseInstance } from '@codeheroes/common';
import { Firestore } from 'firebase-admin/firestore';
import { Activity, ActivityStats } from '../interfaces/activity';
import { ProgressionEventService } from './progression-event.service';

export class ActivityTrackerService {
  private db: Firestore;
  private progressionEvents: ProgressionEventService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.progressionEvents = new ProgressionEventService();
  }

  async trackActivity(activity: Activity): Promise<void> {
    const userRef = this.db.collection('users').doc(activity.userId);
    const activityRef = userRef.collection('activities').doc(activity.id);

    await this.db.runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(userRef);
      const currentStats = (statsDoc.data()?.activityStats || {}) as ActivityStats;

      // Update activity stats
      const newStats: ActivityStats = {
        total: (currentStats.total || 0) + 1,
        byType: {
          ...currentStats.byType,
          [activity.type]: (currentStats.byType?.[activity.type] || 0) + 1,
        },
        lastActivity: {
          type: activity.type,
          timestamp: activity.timestamp,
        },
      };

      transaction.set(activityRef, activity);
      transaction.update(userRef, {
        activityStats: newStats,
        updatedAt: new Date().toISOString(),
      });
    });

    // Emit activity recorded event
    await this.progressionEvents.emitActivityRecorded(activity.userId, activity);
  }

  async getActivityStats(userId: string): Promise<ActivityStats> {
    const statsDoc = await this.db.collection('users').doc(userId).get();
    return (statsDoc.data()?.activityStats || {
      total: 0,
      byType: {},
    }) as ActivityStats;
  }

  async getRecentActivities(userId: string, limit = 10): Promise<Activity[]> {
    const snapshot = await this.db
      .collection('users')
      .doc(userId)
      .collection('activities')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as Activity);
  }
}
