import { DatabaseInstance, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { Collections } from '@codeheroes/shared/types';
import { Firestore } from 'firebase-admin/firestore';
import { getXpProgress } from '../../constants/level-thresholds';
import { Activity } from '../interfaces/activity';
import { ProgressionState, ProgressionUpdate } from '../interfaces/progression';
import { StreakType } from '../interfaces/streak';
import { ProgressionEventService } from './progression-event.service';

export class ProgressionService {
  private db: Firestore;
  private progressionEvents: ProgressionEventService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.progressionEvents = new ProgressionEventService();
  }

  async updateProgression(userId: string, update: ProgressionUpdate, activity?: Activity): Promise<ProgressionState> {
    logger.info('Starting progression update', { userId, xpGained: update.xpGained });
    const userStatsRef = this.db.collection(Collections.UserStats).doc(userId);

    return await this.db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userStatsRef);
      const now = getCurrentTimeAsISO();

      const initialState: ProgressionState = {
        userId,
        xp: 0,
        level: 1,
        currentLevelXp: 0,
        xpToNextLevel: 1000,
        streaks: {
          [StreakType.CodePush]: 0,
          [StreakType.PullRequestCreate]: 0,
          [StreakType.PullRequestClose]: 0,
          [StreakType.PullRequestMerge]: 0,
        },
        achievements: [],
        lastActivityDate: null,
      };

      logger.info('Current user stats document', { exists: userDoc.exists, data: userDoc.data() });

      // Initialize user stats if they don't exist
      if (!userDoc.exists) {
        logger.info('Initializing new user stats', { userId });
        transaction.set(userStatsRef, {
          ...initialState,
          createdAt: now,
          updatedAt: now,
        });
      }

      const previousState: ProgressionState = userDoc.exists ? (userDoc.data() as ProgressionState) : initialState;
      const newTotalXp = previousState.xp + update.xpGained;

      logger.info('Calculating new XP', {
        previousXp: previousState.xp,
        gained: update.xpGained,
        newTotal: newTotalXp,
      });

      // Calculate new level progress
      const { currentLevel, currentLevelXp, xpToNextLevel } = getXpProgress(newTotalXp);

      // Update daily and weekly progress
      // TODO: Implement daily and weekly stats (later)

      // Prepare new state
      const newState: ProgressionState = {
        userId,
        xp: newTotalXp,
        level: currentLevel,
        currentLevelXp,
        xpToNextLevel,
        streaks: {
          ...previousState.streaks,
          ...update.streakUpdates,
        },
        achievements: [...(previousState.achievements || []), ...(update.achievements || [])],
        lastActivityDate: now.split('T')[0],
      };

      // Emit progression events
      if (activity) {
        await this.progressionEvents.emitXpGained(userId, activity, newState, previousState);
      }

      if (currentLevel > previousState.level) {
        await this.progressionEvents.emitLevelUp(userId, newState, previousState);
      }

      if (update.streakUpdates) {
        await this.progressionEvents.emitStreakUpdated(userId, newState, previousState);
      }

      logger.info('Updating user progression', {
        userId,
        xpGained: update.xpGained,
        newLevel: currentLevel,
        previousLevel: previousState.level,
        collection: Collections.UserStats,
        docPath: userStatsRef.path,
      });

      // Update user stats in Firestore
      const updateData = {
        ...newState,
        updatedAt: now,
      };

      transaction.update(userStatsRef, updateData);
      logger.info('User stats update completed');
      return newState;
    });
  }

  async getProgressionState(userId: string): Promise<ProgressionState | null> {
    const userStatsDoc = await this.db.collection(Collections.UserStats).doc(userId).get();
    if (!userStatsDoc.exists) {
      return null;
    }

    const userStats = userStatsDoc.data()!;
    const { currentLevel, currentLevelXp, xpToNextLevel } = getXpProgress(userStats.xp || 0);

    return {
      userId,
      xp: userStats.xp || 0,
      level: currentLevel,
      currentLevelXp,
      xpToNextLevel,
      streaks: userStats.streaks || {
        [StreakType.CodePush]: 0,
        [StreakType.PullRequestCreate]: 0,
        [StreakType.PullRequestClose]: 0,
        [StreakType.PullRequestMerge]: 0,
      },
      achievements: userStats.achievements || [],
      lastActivityDate: userStats.lastActivityDate,
    };
  }
}
