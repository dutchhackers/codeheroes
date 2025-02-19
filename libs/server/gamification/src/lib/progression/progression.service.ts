import { DatabaseInstance, logger } from '@codeheroes/common';
import { Firestore } from 'firebase-admin/firestore';
import { DailyProgressionService } from './daily/daily-progression.service';
import { WeeklyProgressionService } from './weekly/weekly-progression.service';
import { ProgressionState, ProgressionUpdate } from '../core/interfaces/progression';
import { getXpProgress } from '../constants/level-thresholds';
import { Collections } from '../core/constants/collections';

export class ProgressionService {
  public readonly dailyService: DailyProgressionService;
  public readonly weeklyService: WeeklyProgressionService;
  private db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.dailyService = new DailyProgressionService();
    this.weeklyService = new WeeklyProgressionService();
  }

  async updateProgression(userId: string, update: ProgressionUpdate): Promise<ProgressionState> {
    const userStatsRef = this.db.collection(Collections.UserStats).doc(userId);

    return await this.db.runTransaction(async (transaction) => {
      const userStatsDoc = await transaction.get(userStatsRef);
      if (!userStatsDoc.exists) {
        // Initialize user stats if they don't exist
        transaction.set(userStatsRef, {
          userId,
          xp: 0,
          level: 1,
          streaks: {},
          lastActivityDate: null,
        });
      }

      const userStats = userStatsDoc.exists ? userStatsDoc.data()! : {};
      const totalXp = (userStats.xp || 0) + update.xpGained;
      const { currentLevel, currentLevelXp, xpToNextLevel } = getXpProgress(totalXp);

      // Update daily and weekly progress
      await this.dailyService.updateDailyProgress(transaction, userId, update);
      await this.weeklyService.updateWeeklyProgress(transaction, userId, update);

      // Update user stats
      const newState: ProgressionState = {
        userId,
        xp: totalXp,
        level: currentLevel,
        currentLevelXp,
        xpToNextLevel,
        streaks: {
          ...userStats.streaks,
          ...update.streakUpdates,
        },
        lastActivityDate: new Date().toISOString().split('T')[0],
      };

      logger.info('Updating user progression', {
        userId,
        xpGained: update.xpGained,
        newLevel: currentLevel,
        previousLevel: userStats.level || 1,
      });

      // Convert ProgressionState to plain object for Firestore update
      const updateData = Object.entries(newState).reduce(
        (acc, [key, value]) => {
          acc[key] = value;
          return acc;
        },
        {} as Record<string, any>,
      );

      transaction.update(userStatsRef, updateData);
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
      streaks: userStats.streaks || {},
      lastActivityDate: userStats.lastActivityDate,
    };
  }
}
