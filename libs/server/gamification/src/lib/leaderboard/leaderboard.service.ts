import { DatabaseInstance } from '@codeheroes/common';
import { Firestore } from 'firebase-admin/firestore';
import { LeaderboardEntry } from '../core/interfaces/progression';
import { Collections } from '../core/constants/collections';

export class LeaderboardService {
  private db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  async getDailyLeaderboard(date: string, limit = 10): Promise<LeaderboardEntry[]> {
    const snapshot = await this.db
      .collectionGroup('dailyStats')
      .where('date', '==', date)
      .orderBy('xp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        userId: data.userId,
        xp: data.xp || 0,
        level: data.level || 1,
        rank: index + 1,
      };
    });
  }

  async getWeeklyLeaderboard(weekId: string, limit = 10): Promise<LeaderboardEntry[]> {
    const snapshot = await this.db
      .collectionGroup('weeklyStats')
      .where('weekId', '==', weekId)
      .orderBy('xp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        userId: data.userId,
        xp: data.xp || 0,
        level: data.level || 1,
        rank: index + 1,
      };
    });
  }
}
