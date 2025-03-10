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

async function getWeeklyXpLeaderboard(weekId?: string) {
  const db = getFirestore();
  const recordId = weekId || getTimePeriodIds().weekly;

  // First get all users
  const usersSnapshot = await db.collection(Collections.Users).get();

  // Then query each user's weekly stats and current stats
  const userPromises = usersSnapshot.docs.map(async (userDoc) => {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const userDisplayName = userData.displayName || userId;

    // Get weekly stats
    const weeklyStatDoc = await db
      .collection(Collections.Users)
      .doc(userId)
      .collection('activityStats')
      .doc('weekly')
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

    const weeklyStats = weeklyStatDoc.exists ? (weeklyStatDoc.data() as TimeBasedActivityStats) : null;
    const userStats = userStatsDoc.exists ? userStatsDoc.data() : null;

    return {
      userId,
      displayName: userDisplayName,
      photoUrl: userData.photoUrl || null,
      xpGained: weeklyStats?.xpGained || 0,
      weekId: recordId,
      // Additional user stats
      level: userStats?.level || 0,
      totalXp: userStats?.xp || 0,
      currentLevelXp: userStats?.currentLevelXp || 0,
      xpToNextLevel: userStats?.xpToNextLevel || 0,
    };
  });

  // Resolve all promises and sort by XP gained this week
  const results = await Promise.all(userPromises);
  return results.sort((a, b) => b.xpGained - a.xpGained);
}

router.get('/week/:weekId?', async (req, res) => {
  const weekId = req.params.weekId;
  logger.debug(`GET /leaderboards/week${weekId ? `/${weekId}` : ''}`);

  try {
    const leaderboard = await getWeeklyXpLeaderboard(weekId);
    res.json(leaderboard);
  } catch (error) {
    logger.error('Error getting weekly leaderboard:', error);
    res.status(500).json({ error: 'Failed to retrieve weekly leaderboard' });
  }
});

export { router as LeaderboardsController };
