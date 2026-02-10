import { logger } from '@codeheroes/common';
import { TimeBasedActivityStats, Collections } from '@codeheroes/types';
import * as express from 'express';
import { getFirestore } from 'firebase-admin/firestore';

const router = express.Router();

interface TimePeriod {
  daily: string;
  weekly: string;
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7)); // Set to nearest Thursday
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getTimePeriodIds(timestamp?: string): TimePeriod {
  const date = timestamp ? new Date(timestamp) : new Date();

  // Daily ID: YYYY-MM-DD
  const dailyId = date.toISOString().slice(0, 10);

  // Weekly ID: YYYY-WXX
  const weekNumber = getISOWeekNumber(date);
  const weeklyId = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;

  return { daily: dailyId, weekly: weeklyId };
}

/**
 * Represents an entry in the leaderboard system.
 * @experimental This interface is experimental and subject to change.
 * @interface LeaderboardEntry
 * @property {string} userId - Unique identifier for the user
 * @property {string} displayName - User's display name shown on the leaderboard
 * @property {string | null} photoUrl - URL to user's profile photo, null if not set
 * @property {number} xpGained - Experience points gained in the current period
 * @property {string} periodId - Identifier for the leaderboard period
 * @property {number} level - Current level of the user
 * @property {number} totalXp - Total experience points accumulated by the user
 * @property {number} currentLevelXp - Experience points in the current level
 * @property {number} xpToNextLevel - Experience points needed to reach next level
 */
interface LeaderboardEntry {
  userId: string;
  name: string | null;
  displayName: string;
  photoUrl: string | null;
  xpGained: number;
  periodId: string;
  level: number;
  totalXp: number;
  currentLevelXp: number;
  xpToNextLevel: number;
}

interface LeaderboardOptions {
  includeZeroXp?: boolean;
}

async function getXpLeaderboard(
  periodType: 'daily' | 'weekly',
  periodId?: string,
  options: LeaderboardOptions = {},
): Promise<LeaderboardEntry[]> {
  const db = getFirestore();
  const recordId = periodId || getTimePeriodIds()[periodType];
  const defaultOptions = {
    includeZeroXp: false,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // First get all users
  const usersSnapshot = await db.collection(Collections.Users).get();

  // Then query each user's stats
  const userPromises = usersSnapshot.docs.map(async (userDoc) => {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const userDisplayName = userData.displayName || userId;

    // Get period stats (daily or weekly)
    const periodStatDoc = await db
      .collection(Collections.Users)
      .doc(userId)
      .collection('activityStats')
      .doc(periodType)
      .collection('records')
      .doc(recordId)
      .get();

    // Get current user stats
    const userStatsDoc = await db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Stats)
      .doc('current')
      .get();

    const periodStats = periodStatDoc.exists ? (periodStatDoc.data() as TimeBasedActivityStats) : null;
    const userStats = userStatsDoc.exists ? userStatsDoc.data() : null;

    return {
      userId,
      name: userData.name || null,
      displayName: userDisplayName,
      photoUrl: userData.photoUrl || null,
      xpGained: periodStats?.xpGained || 0,
      periodId: recordId,
      level: userStats?.level || 0,
      totalXp: userStats?.xp || 0,
      currentLevelXp: userStats?.currentLevelXp || 0,
      xpToNextLevel: userStats?.xpToNextLevel || 0,
    };
  });

  // Resolve all promises and filter/sort results
  let results = await Promise.all(userPromises);

  // Filter out users with 0 XP if required
  if (!mergedOptions.includeZeroXp) {
    results = results.filter((entry) => entry.xpGained > 0);
  }

  // Sort by XP gained (highest first)
  return results.sort((a, b) => b.xpGained - a.xpGained);
}

// Weekly leaderboard endpoint
router.get('/week/:weekId?', async (req, res) => {
  const weekId = req.params.weekId;
  const includeZeroXp = req.query.includeZeroXp === 'true';

  logger.debug(`GET /leaderboards/week${weekId ? `/${weekId}` : ''}`, { includeZeroXp });

  try {
    const leaderboard = await getXpLeaderboard('weekly', weekId, { includeZeroXp });
    res.json(leaderboard);
  } catch (error) {
    logger.error('Error getting weekly leaderboard:', error);
    res.status(500).json({ error: 'Failed to retrieve weekly leaderboard' });
  }
});

// Daily leaderboard endpoint
router.get('/day/:dayId?', async (req, res) => {
  const dayId = req.params.dayId;
  const includeZeroXp = req.query.includeZeroXp === 'true';

  logger.debug(`GET /leaderboards/day${dayId ? `/${dayId}` : ''}`, { includeZeroXp });

  try {
    const leaderboard = await getXpLeaderboard('daily', dayId, { includeZeroXp });
    res.json(leaderboard);
  } catch (error) {
    logger.error('Error getting daily leaderboard:', error);
    res.status(500).json({ error: 'Failed to retrieve daily leaderboard' });
  }
});

export { router as LeaderboardsController };
