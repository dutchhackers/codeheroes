import { Firestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { UserActivity } from '../activity';
import { DatabaseInstance, getCurrentTimeAsISO } from '../core/firebase';
import { XpCalculationResponse, XpHistoryEntry } from './gamification.model';
import { calculateLevelProgress } from './level.utils';

export class XpDatabaseService {
  private db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  async updateUserXp(
    userId: string,
    activityId: string,
    xpResult: XpCalculationResponse,
    activity: UserActivity
  ): Promise<void> {
    const userRef = this.db.collection('users').doc(userId);

    try {
      await this.db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error('User document not found!');
        }

        const user = userDoc.data()!;
        const currentXp = user.xp || 0;
        const updatedXp = currentXp + xpResult.totalXp;
        
        // Calculate level progress with potential overflow XP
        const levelProgress = calculateLevelProgress(updatedXp, user.achievements || [], user.tasks || []);

        const xpHistoryEntry: XpHistoryEntry = {
          id: this.db.collection('users').doc().id,
          xpChange: xpResult.totalXp,
          newXp: updatedXp,
          newLevel: levelProgress.currentLevel,
          currentLevelXp: levelProgress.currentLevelXp,
          activityId,
          activityType: activity.type,
          breakdown: xpResult.breakdown,
          createdAt: getCurrentTimeAsISO(),
          updatedAt: getCurrentTimeAsISO(),
        };

        // Update user document with current level XP
        transaction.update(userRef, {
          xp: updatedXp,
          level: levelProgress.currentLevel,
          currentLevelXp: levelProgress.currentLevelXp,
          xpToNextLevel: levelProgress.xpToNextLevel,
          updatedAt: getCurrentTimeAsISO(),
        });

        // Create XP history entry
        const xpHistoryRef = userRef.collection('xpHistory').doc(xpHistoryEntry.id);
        transaction.set(xpHistoryRef, xpHistoryEntry);

        // Update activity document
        const activityRef = userRef.collection('activities').doc(activityId);
        transaction.update(activityRef, {
          processingResult: {
            processed: true,
            processedAt: getCurrentTimeAsISO(),
            xp: {
              processed: true,
              awarded: xpResult.totalXp,
              breakdown: xpResult.breakdown,
            },
            // Future additions:
            // badges: earnedBadges,
            // achievements: updatedAchievements,
          },
          updatedAt: getCurrentTimeAsISO(),
        });
      });

      logger.info('Successfully updated user XP and created history entry', { userId, activityId });
    } catch (error) {
      logger.error('Failed to update user XP', { error, userId, activityId });
      throw error;
    }
  }
}
