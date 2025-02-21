import { Firestore } from 'firebase-admin/firestore';
import { DatabaseInstance } from '@codeheroes/common';

export enum StreakType {
  CODE_PUSH = 'code_pushes',
  PULL_REQUEST = 'pull_requests',
  CODE_REVIEW = 'code_reviews',
}

export interface StreakResult {
  newStreak: number;
  bonusXP: number;
}

export class StreakService {
  private db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  async calculateStreak(userId: string, streakType: StreakType): Promise<StreakResult> {
    const userRef = this.db.collection('users').doc(userId);
    const streakDoc = await userRef.collection('streaks').doc(streakType).get();
    const today = new Date().toISOString().split('T')[0];

    const streakData = streakDoc.data() || {
      current: 0,
      lastActionDate: null,
    };

    if (streakData.lastActionDate === today) {
      return {
        newStreak: streakData.current,
        bonusXP: 0,
      };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    let bonusXP = 0;

    if (streakData.lastActionDate === yesterdayStr) {
      newStreak = streakData.current + 1;

      // Calculate streak bonus
      if (newStreak >= 7) bonusXP = 3000;
      else if (newStreak >= 5) bonusXP = 2000;
      else if (newStreak >= 3) bonusXP = 1000;
    }

    // Update streak data
    await userRef
      .collection('streaks')
      .doc(streakType)
      .set({
        current: newStreak,
        best: Math.max(newStreak, streakData.best || 0),
        lastActionDate: today,
      });

    return { newStreak, bonusXP };
  }

  async getStreak(userId: string, streakType: StreakType): Promise<number> {
    const doc = await this.db.collection('users').doc(userId).collection('streaks').doc(streakType).get();

    return doc.data()?.current || 0;
  }
}
