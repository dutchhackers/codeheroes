import * as logger from 'firebase-functions/logger';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { CreateActivityInput, getCurrentTimeAsISO, UserActivity, XpCalculationResponse, XpHistoryEntry } from '@codeheroes/common';
import { calculateLevel } from '../utils/level.utils';

export class DatabaseService {
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
  }

  async lookupUserId(details: Record<string, unknown>): Promise<string | undefined> {
    const sender = details.sender as { id: string; login: string } | undefined;

    if (!sender?.id) {
      logger.warn('No sender ID found in event details');
      return undefined;
    }

    try {
      const connectedAccountSnapshot = await this.db
        .collectionGroup('connectedAccounts')
        .where('provider', '==', 'github')
        .where('externalUserId', '==', sender.id)
        .limit(1)
        .get();

      if (!connectedAccountSnapshot.empty) {
        const parentRef = connectedAccountSnapshot.docs[0].ref.parent.parent;
        if (!parentRef) {
          logger.warn('Invalid document reference structure');
          return undefined;
        }
        const userId = parentRef.id;
        logger.info('User ID found', { userId, senderId: sender.id });
        return userId;
      }

      logger.warn('No matching user found for sender', { senderId: sender.id, login: sender.login });
      return undefined;
    } catch (error) {
      logger.error('Error looking up user ID', { error, senderId: sender.id });
      throw error;
    }
  }

  async createUserActivity(activityInput: CreateActivityInput): Promise<void> {
    const userId = activityInput.userId;
    const docRef = this.db.collection('users').doc(userId).collection('activities').doc();
    const now = getCurrentTimeAsISO();

    try {
      await docRef.create({
        id: docRef.id,
        ...activityInput,
        createdAt: now,
        updatedAt: now,
      });

      logger.info('Created new user activity', { userId });
    } catch (error) {
      logger.error('Failed to create user activity', error);
      throw error;
    }
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
        const levelUpResult = calculateLevel(
          user.level || 1,
          user.xpToNextLevel || 100,
          updatedXp,
          { baseXpPerLevel: 100, xpMultiplier: 1.5 }
        );

        const xpHistoryEntry: XpHistoryEntry = {
          id: this.db.collection('users').doc().id,
          xpChange: xpResult.totalXp,
          newXp: updatedXp,
          newLevel: levelUpResult.level,
          activityId,
          activityType: activity.type,
          breakdown: xpResult.breakdown,
          createdAt: getCurrentTimeAsISO(),
          updatedAt: getCurrentTimeAsISO()
        };

        // Update user document
        transaction.update(userRef, {
          xp: updatedXp,
          level: levelUpResult.level,
          xpToNextLevel: levelUpResult.xpToNextLevel,
          updatedAt: getCurrentTimeAsISO()
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
              breakdown: xpResult.breakdown
            }
            // Future additions:
            // badges: earnedBadges,
            // achievements: updatedAchievements,
          },
          updatedAt: getCurrentTimeAsISO()
        });
      });

      logger.info('Successfully updated user XP and created history entry', { userId, activityId });
    } catch (error) {
      logger.error('Failed to update user XP', { error, userId, activityId });
      throw error;
    }
  }
}
