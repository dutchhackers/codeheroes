import { Firestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { UserActivity } from '../activity';
import { DatabaseInstance, getCurrentTimeAsISO } from '../core/firebase';
import { XpCalculationResponse, XpHistoryEntry } from './gamification-domain.model';
import { calculateLevel } from './level.utils';

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
        const updatedXp = (user.xp || 0) + xpResult.totalXp;
        const levelUpResult = calculateLevel(user.level || 1, user.xpToNextLevel || 100, updatedXp, {
          baseXpPerLevel: 100,
          xpMultiplier: 1.5,
        });

        const xpHistoryEntry: XpHistoryEntry = {
          id: this.db.collection('users').doc().id,
          xpChange: xpResult.totalXp,
          newXp: updatedXp,
          newLevel: levelUpResult.level,
          activityId,
          activityType: activity.type,
          breakdown: xpResult.breakdown,
          createdAt: getCurrentTimeAsISO(),
          updatedAt: getCurrentTimeAsISO(),
        };

        // Update user document
        transaction.update(userRef, {
          xp: updatedXp,
          level: levelUpResult.level,
          xpToNextLevel: levelUpResult.xpToNextLevel,
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
