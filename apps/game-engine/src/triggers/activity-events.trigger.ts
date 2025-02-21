import { DatabaseInstance, logger } from '@codeheroes/common';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { Collections, ProgressionEvent, ProgressionEventType } from '@codeheroes/gamification';

export const onActivityRecorded = onMessagePublished('progression-events', async (event) => {
  const db: Firestore = DatabaseInstance.getInstance();

  const progressionEvent = event.data.message.json as ProgressionEvent;
  if (progressionEvent.type !== ProgressionEventType.ACTIVITY_RECORDED) return;

  const { userId, data } = progressionEvent;
  const activity = data.activity;
  if (!activity) return;

  try {
    // Handle first-time activity achievements
    const stats = await getActivityStats(userId, activity.type);
    if (stats.total === 1) {
      await recordAchievement(userId, {
        id: `first_${activity.type}`,
        name: `First ${activity.type.replace(/_/g, ' ')}`,
        description: `Completed your first ${activity.type.replace(/_/g, ' ')}`,
        timestamp: progressionEvent.timestamp,
      });
    }

    // Handle milestone achievements
    const milestones = [10, 50, 100, 500];
    const nextMilestone = milestones.find((m) => stats.total === m);
    if (nextMilestone) {
      await recordAchievement(userId, {
        id: `${activity.type}_milestone_${nextMilestone}`,
        name: `${activity.type.replace(/_/g, ' ')} Master ${nextMilestone}`,
        description: `Completed ${nextMilestone} ${activity.type.replace(/_/g, ' ')}s`,
        timestamp: progressionEvent.timestamp,
      });
    }

    // Handle consistency achievements (daily activity)
    const consecutiveDays = await getConsecutiveActivityDays(userId, activity.type);
    if (consecutiveDays === 7) {
      await recordAchievement(userId, {
        id: `${activity.type}_weekly_consistent`,
        name: `Weekly ${activity.type.replace(/_/g, ' ')} Warrior`,
        description: `Completed ${activity.type.replace(/_/g, ' ')}s for 7 consecutive days`,
        timestamp: progressionEvent.timestamp,
      });

      // Award bonus XP for consistency
      await updateUserXP(userId, 1000, 'consistency_bonus');
    }
  } catch (error) {
    logger.error('Error processing activity recorded event:', error);
    throw error;
  }
});

async function getActivityStats(userId: string, activityType: string): Promise<{ total: number }> {
  const db: Firestore = DatabaseInstance.getInstance();

  const statsDoc = await db.collection(Collections.UserStats).doc(userId).get();

  const stats = statsDoc.data()?.activityStats || {};
  return {
    total: stats.byType?.[activityType] || 0,
  };
}

async function getConsecutiveActivityDays(userId: string, activityType: string): Promise<number> {
  const db = DatabaseInstance.getInstance();
  const today = new Date().toISOString().split('T')[0];
  const activityDocs = await db
    .collection(Collections.UserStats)
    .doc(userId)
    .collection(Collections.UserStats_DailyStats)
    .where('date', '<=', today)
    .orderBy('date', 'desc')
    .limit(7)
    .get();

  let consecutiveDays = 0;
  let currentDate = new Date(today);

  for (const doc of activityDocs.docs) {
    const data = doc.data();
    const docDate = new Date(data.date);

    // Check if this is the next consecutive day
    const diffDays = Math.floor((currentDate.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays !== 1 || !data.activities?.[activityType]) {
      break;
    }

    consecutiveDays++;
    currentDate = docDate;
  }

  return consecutiveDays;
}

async function recordAchievement(
  userId: string,
  achievement: {
    id: string;
    name: string;
    description: string;
    timestamp: string;
  },
): Promise<void> {
  const db = DatabaseInstance.getInstance();
  const userRef = db.collection(Collections.UserStats).doc(userId);
  const achievementRef = userRef.collection('achievements').doc(achievement.id);

  await db.runTransaction(async (transaction) => {
    transaction.set(achievementRef, achievement);
    transaction.update(userRef, {
      'stats.achievements.total': FieldValue.increment(1),
      'stats.achievements.lastEarned': achievement.timestamp,
    });
  });
}

async function updateUserXP(userId: string, amount: number, reason: string): Promise<void> {
  const db = DatabaseInstance.getInstance();
  const userRef = db.collection(Collections.UserStats).doc(userId);
  await userRef.update({
    xp: FieldValue.increment(amount),
    [`xpHistory.${new Date().toISOString()}`]: {
      amount,
      reason,
      timestamp: FieldValue.serverTimestamp(),
    },
  });
}
