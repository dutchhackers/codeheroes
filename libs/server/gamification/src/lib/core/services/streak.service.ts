import { logger } from '@codeheroes/common';
import { Firestore } from 'firebase-admin/firestore';
import { XP_SETTINGS } from '../../constants/xp-settings';
import { StreakResult, StreakType } from '../interfaces/streak';

export class StreakService {
  constructor(private db: Firestore) {}

  async calculateStreak(
    transaction: FirebaseFirestore.Transaction,
    userStatsRef: FirebaseFirestore.DocumentReference,
    stats: FirebaseFirestore.DocumentData,
    streakType: StreakType,
  ): Promise<StreakResult> {
    const today = new Date().toISOString().split('T')[0];

    // Initialize streak data if not present
    if (!stats.streaks) {
      stats.streaks = {};
    }

    const streakData = stats.streaks[streakType] || {
      current: 0,
      best: 0,
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

      // Calculate streak bonus based on the streak milestone
      if (newStreak === 7) bonusXP = XP_SETTINGS.STREAK.DAY_7;
      else if (newStreak === 5) bonusXP = XP_SETTINGS.STREAK.DAY_5;
      else if (newStreak === 3) bonusXP = XP_SETTINGS.STREAK.DAY_3;
      else if (newStreak === 1) bonusXP = XP_SETTINGS.STREAK.DAY_1;

      logger.log('Calculated streak bonus', { newStreak, bonusXP });
    }

    // Update streak data
    transaction.update(userStatsRef, {
      [`streaks.${streakType}.current`]: newStreak,
      [`streaks.${streakType}.best`]: Math.max(newStreak, streakData.best),
      [`streaks.${streakType}.lastActionDate`]: today,
    });

    return { newStreak, bonusXP };
  }
}
