import { DatabaseInstance } from '@codeheroes/common';
import { Firestore, FieldValue } from 'firebase-admin/firestore';
import { ProgressionUpdate } from '../../core/interfaces/progression';
import { Collections } from '../../core/constants/collections';

export class DailyProgressionService {
  private db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  async updateDailyProgress(
    transaction: FirebaseFirestore.Transaction,
    userId: string,
    update: ProgressionUpdate,
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const dailyRef = this.db
      .collection(Collections.UserStats)
      .doc(userId)
      .collection(Collections.UserStats_DailyStats)
      .doc(today);

    const updateData: Record<string, any> = {
      userId,
      xp: FieldValue.increment(update.xpGained),
      level: update.newLevel,
      activityTypes: FieldValue.arrayUnion(update.activityType),
      lastUpdated: FieldValue.serverTimestamp(),
    };

    // Add or update counter for activity type if provided
    if (update.activityType) {
      const doc = await transaction.get(dailyRef);
      const currentData = doc.data() || {};
      const currentActivities = currentData.activities || {};
      
      updateData.activities = {
        ...currentActivities,
        [update.activityType]: FieldValue.increment(1)
      };
    }

    transaction.set(dailyRef, updateData, { merge: true });
  }
}
