import { logger } from '@codeheroes/common';
import { getRecentWeeklyIds } from '@codeheroes/progression-engine';
import { Collections, TimeBasedActivityStats, TrendsEntityData, TrendsProjectData, TrendsResponse, TrendsWeeklyDataPoint } from '@codeheroes/types';
import * as express from 'express';
import { getFirestore } from 'firebase-admin/firestore';

const router = express.Router();

router.get('/weekly', async (req, res) => {
  const weeks = Math.min(Math.max(parseInt(req.query.weeks as string, 10) || 10, 1), 52);

  logger.debug(`GET /trends/weekly?weeks=${weeks}`);

  try {
    const db = getFirestore();
    const weekIds = getRecentWeeklyIds(weeks);

    const [usersSnapshot, projectsSnapshot] = await Promise.all([
      db.collection(Collections.Users).get(),
      db.collection(Collections.Projects).get(),
    ]);

    // Fetch user stats
    const userStatsDoc = await Promise.all(
      usersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        const userData = userDoc.data();

        const currentStatsDoc = await db
          .collection(Collections.Users)
          .doc(userId)
          .collection(Collections.Stats)
          .doc('current')
          .get();
        const currentStats = currentStatsDoc.exists ? currentStatsDoc.data() : null;

        // Batch read all week docs using getAll
        const weekRefs = weekIds.map((weekId) =>
          db
            .collection(Collections.Users)
            .doc(userId)
            .collection('activityStats')
            .doc('weekly')
            .collection('records')
            .doc(weekId),
        );
        const weekDocs = await db.getAll(...weekRefs);

        const weeklyData: TrendsWeeklyDataPoint[] = weekIds.map((weekId, index) => {
          const doc = weekDocs[index];
          const data = doc.exists ? (doc.data() as TimeBasedActivityStats) : null;
          return {
            weekId,
            xpGained: data?.xpGained || 0,
            counters: data?.counters?.actions
              ? Object.fromEntries(Object.entries(data.counters.actions).filter(([, v]) => v > 0))
              : {},
          };
        });

        const hasAnyXp = weeklyData.some((w) => w.xpGained > 0);

        return {
          entity: {
            id: userId,
            displayName: userData.displayName || userId,
            photoUrl: userData.photoUrl || null,
            level: currentStats?.level || 0,
            totalXp: currentStats?.xp || 0,
            weeklyData,
          } as TrendsEntityData,
          userType: userData.userType || 'user',
          hasAnyXp,
        };
      }),
    );

    // Fetch project stats
    const projectStats = await Promise.all(
      projectsSnapshot.docs.map(async (projectDoc) => {
        const projectId = projectDoc.id;
        const projectData = projectDoc.data();

        const currentStatsDoc = await db
          .collection(Collections.Projects)
          .doc(projectId)
          .collection(Collections.Stats)
          .doc('current')
          .get();
        const currentStats = currentStatsDoc.exists ? currentStatsDoc.data() : null;

        const weekRefs = weekIds.map((weekId) =>
          db
            .collection(Collections.Projects)
            .doc(projectId)
            .collection('activityStats')
            .doc('weekly')
            .collection('records')
            .doc(weekId),
        );
        const weekDocs = await db.getAll(...weekRefs);

        const weeklyData: TrendsWeeklyDataPoint[] = weekIds.map((weekId, index) => {
          const doc = weekDocs[index];
          const data = doc.exists ? (doc.data() as TimeBasedActivityStats) : null;
          return {
            weekId,
            xpGained: data?.xpGained || 0,
            counters: data?.counters?.actions
              ? Object.fromEntries(Object.entries(data.counters.actions).filter(([, v]) => v > 0))
              : {},
          };
        });

        const hasAnyXp = weeklyData.some((w) => w.xpGained > 0);

        return {
          project: {
            id: projectId,
            name: projectData.name || projectId,
            slug: projectData.slug || projectId,
            totalXp: currentStats?.xp || 0,
            weeklyData,
          } as TrendsProjectData,
          hasAnyXp,
        };
      }),
    );

    // Split users by type, filter out zero-XP entities, sort by total XP across weeks
    const sortByTotalWeeklyXp = (a: { weeklyData: TrendsWeeklyDataPoint[] }, b: { weeklyData: TrendsWeeklyDataPoint[] }) => {
      const totalA = a.weeklyData.reduce((sum, w) => sum + w.xpGained, 0);
      const totalB = b.weeklyData.reduce((sum, w) => sum + w.xpGained, 0);
      return totalB - totalA;
    };

    const users = userStatsDoc
      .filter((u) => u.hasAnyXp && u.userType === 'user')
      .map((u) => u.entity)
      .sort(sortByTotalWeeklyXp);

    const bots = userStatsDoc
      .filter((u) => u.hasAnyXp && u.userType === 'bot')
      .map((u) => u.entity)
      .sort(sortByTotalWeeklyXp);

    const projects = projectStats
      .filter((p) => p.hasAnyXp)
      .map((p) => p.project)
      .sort(sortByTotalWeeklyXp);

    const response: TrendsResponse = { weekIds, users, bots, projects };

    res.json(response);
  } catch (error) {
    logger.error('Error getting weekly trends:', error);
    res.status(500).json({ error: 'Failed to retrieve weekly trends' });
  }
});

export { router as TrendsController };
