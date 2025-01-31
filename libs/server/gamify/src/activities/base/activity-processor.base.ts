import { UserActivity } from '@codeheroes/activity';
import { DatabaseInstance, getCurrentTimeAsISO } from '@codeheroes/common';
import { Firestore } from 'firebase-admin/firestore';
import { ActivityProcessingResult, XpCalculationResponse } from '../../models/gamification.model';

export abstract class BaseActivityProcessor {
  protected db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  /**
   * Process the activity and update necessary data in the database
   */
  abstract processActivity(
    userId: string,
    activityId: string,
    activity: UserActivity,
    xpResult: XpCalculationResponse,
  ): Promise<void>;

  /**
   * Create the base processing result object
   */
  protected createBaseProcessingResult(xpResult: XpCalculationResponse): ActivityProcessingResult {
    return {
      processed: true,
      processedAt: getCurrentTimeAsISO(),
      xp: {
        processed: true,
        awarded: xpResult.totalXp,
        breakdown: xpResult.breakdown,
      },
    };
  }

  /**
   * Update activity document with processing results
   */
  protected async updateActivityDocument(
    userRef: FirebaseFirestore.DocumentReference,
    activityId: string,
    processingResult: ActivityProcessingResult,
  ): Promise<void> {
    const activityRef = userRef.collection('activities').doc(activityId);
    await activityRef.update({
      processingResult,
      updatedAt: getCurrentTimeAsISO(),
    });
  }

  /**
   * Create XP history entry
   */
  protected async createXpHistoryEntry(
    userRef: FirebaseFirestore.DocumentReference,
    activity: UserActivity,
    xpResult: XpCalculationResponse,
    newXp: number,
    newLevel: number,
    currentLevelXp: number,
  ): Promise<void> {
    const xpHistoryEntry = {
      id: this.db.collection('users').doc().id,
      xpChange: xpResult.totalXp,
      newXp,
      newLevel,
      currentLevelXp,
      activityId: activity.id,
      activityType: activity.type,
      breakdown: xpResult.breakdown,
      createdAt: getCurrentTimeAsISO(),
      updatedAt: getCurrentTimeAsISO(),
    };

    const xpHistoryRef = userRef.collection('xpHistory').doc(xpHistoryEntry.id);
    await xpHistoryRef.set(xpHistoryEntry);
  }
}
