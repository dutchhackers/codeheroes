import { DatabaseInstance } from '@codeheroes/common';
import { Firestore, FieldValue } from 'firebase-admin/firestore';
import { ProgressionUpdate } from '../../core/interfaces/progression';
import { Collections } from '../../core/constants/collections';

export class WeeklyProgressionService {
  private db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  async updateWeeklyProgress(
    transaction: FirebaseFirestore.Transaction,
    userId: string,
    update: ProgressionUpdate,
  ): Promise<void> {
    const weekId = this.getCurrentWeekId();
    const weeklyRef = this.db
      .collection(Collections.UserStats)
      .doc(userId)
      .collection(Collections.UserStats_DailyStats)
      .doc(weekId);

    transaction.set(
      weeklyRef,
      {
        userId,
        weekId,
        xp: FieldValue.increment(update.xpGained),
        level: update.newLevel,
        activityTypes: FieldValue.arrayUnion(update.activityType),
        lastUpdated: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  private getCurrentWeekId(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const week = Math.floor(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`;
  }
}
