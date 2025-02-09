import { UserActivity } from '@codeheroes/activity';
import { DatabaseInstance, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { Firestore } from 'firebase-admin/firestore';
import { ActivityProcessingResult, XpCalculationResponse } from '../../models/gamification.model';
import { calculateLevelProgress } from '../../core/level.utils';

export abstract class BaseActivityProcessor {
  protected db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  /**
   * Template method that handles the common processing flow
   */
  async processActivity(
    userId: string,
    activityId: string,
    activity: UserActivity,
    xpResult: XpCalculationResponse,
  ): Promise<void> {
    const userRef = this.db.collection('users').doc(userId);

    try {
      await this.db.runTransaction(async (transaction) => {
        // Get user document
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error('User document not found!');
        }

        const userData = userDoc.data()!;

        // Calculate new XP and level
        const currentXp = userData.xp || 0;
        const updatedXp = currentXp + xpResult.totalXp;
        const levelProgress = calculateLevelProgress(updatedXp, userData.achievements || [], userData.tasks || []);

        // Process activity-specific achievements and updates
        const processingResult = await this.processSpecificActivity(userData, activity, xpResult);

        // Update user document
        const userUpdates = await this.getUserDocumentUpdates(userData, activity, levelProgress);
        transaction.update(userRef, {
          xp: updatedXp,
          level: levelProgress.currentLevel,
          currentLevelXp: levelProgress.currentLevelXp,
          xpToNextLevel: levelProgress.xpToNextLevel,
          updatedAt: getCurrentTimeAsISO(),
          ...userUpdates,
        });

        // Update activity document
        await this.updateActivityDocument(userRef, activityId, processingResult);

        // Create XP history entry
        await this.createXpHistoryEntry(
          userRef,
          activity,
          xpResult,
          updatedXp,
          levelProgress.currentLevel,
          levelProgress.currentLevelXp,
        );
      });

      logger.info('Successfully processed activity', {
        userId,
        activityId,
        activityType: activity.type,
      });
    } catch (error) {
      logger.error('Failed to process activity', {
        error,
        userId,
        activityId,
        activityType: activity.type,
      });
      throw error;
    }
  }

  /**
   * Process activity-specific logic and return processing result
   * Override this in derived classes to add specific processing logic
   */
  protected async processSpecificActivity(
    userData: any,
    activity: UserActivity,
    xpResult: XpCalculationResponse,
  ): Promise<ActivityProcessingResult> {
    return this.createBaseProcessingResult(xpResult);
  }

  /**
   * Get additional user document updates specific to the activity type
   * Override this in derived classes to add specific user document updates
   */
  protected async getUserDocumentUpdates(
    userData: any,
    activity: UserActivity,
    levelProgress: { currentLevel: number; currentLevelXp: number; xpToNextLevel: number },
  ): Promise<Record<string, any>> {
    return {};
  }

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
  private async updateActivityDocument(
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
  private async createXpHistoryEntry(
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
