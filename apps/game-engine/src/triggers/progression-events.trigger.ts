import { DatabaseInstance } from '@codeheroes/common';
import { Collections } from '@codeheroes/gamification';
import { FieldValue } from 'firebase-admin/firestore';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';

export const onLevelUp = onMessagePublished('progression-events', async (event) => {
  const db = DatabaseInstance.getInstance();

  const progressionEvent = event.data.message.json;
  if (progressionEvent.type !== 'progression.level.up') return;

  const { userId, data } = progressionEvent;
  const newLevel = data.state?.level;

  // Transaction to ensure atomic updates
  await db.runTransaction(async (transaction) => {
    // Record level up achievement
    await recordAchievement(transaction, userId, {
      id: `level_${newLevel}`,
      name: `Level ${newLevel}`,
      description: `Reached level ${newLevel}`,
      timestamp: progressionEvent.timestamp,
    });

    // Check for level-based achievements
    if (newLevel === 5) {
      await recordAchievement(transaction, userId, {
        id: 'intermediate_hero',
        name: 'Intermediate Hero',
        description: 'Reached level 5',
        timestamp: progressionEvent.timestamp,
      });
    } else if (newLevel === 10) {
      await recordAchievement(transaction, userId, {
        id: 'advanced_hero',
        name: 'Advanced Hero',
        description: 'Reached level 10',
        timestamp: progressionEvent.timestamp,
      });
    }

    // Create notification
    await createNotification(transaction, userId, {
      type: 'LEVEL_UP',
      title: 'Level Up!',
      message: `Congratulations! You've reached level ${newLevel}!`,
      metadata: { level: newLevel },
    });
  });
});

export const onStreakUpdated = onMessagePublished('progression-events', async (event) => {
  const db = DatabaseInstance.getInstance();
  const progressionEvent = event.data.message.json;
  if (progressionEvent.type !== 'progression.streak.updated') return;

  const { userId, data } = progressionEvent;
  const streaks = data.state?.streaks;
  if (!streaks) return;

  await db.runTransaction(async (transaction) => {
    for (const [streakType, days] of Object.entries(streaks)) {
      // Record streak achievements
      if (days === 7) {
        await recordAchievement(transaction, userId, {
          id: `weekly_streak_${streakType}`,
          name: 'Weekly Warrior',
          description: `Maintained a 7-day streak in ${streakType}`,
          timestamp: progressionEvent.timestamp,
        });
      } else if (days === 30) {
        await recordAchievement(transaction, userId, {
          id: `monthly_streak_${streakType}`,
          name: 'Monthly Master',
          description: `Maintained a 30-day streak in ${streakType}`,
          timestamp: progressionEvent.timestamp,
        });
      }

      // Create notification for significant streaks
      if (days === 7 || days === 30) {
        await createNotification(transaction, userId, {
          type: 'STREAK_MILESTONE',
          title: 'Streak Achievement!',
          message: `Amazing! You've maintained your ${streakType} streak for ${days} days!`,
          metadata: { streakType, days },
        });
      }
    }
  });
});

export const onBadgeEarned = onMessagePublished('progression-events', async (event) => {
  const db = DatabaseInstance.getInstance();

  const progressionEvent = event.data.message.json;
  if (progressionEvent.type !== 'progression.badge.earned') return;

  const { userId, data } = progressionEvent;
  const badgeId = data.badgeId;

  await db.runTransaction(async (transaction) => {
    // Get user's current badges
    const userBadges = await transaction.get(
      db.collection(Collections.Users).doc(userId).collection(Collections.User_UserBadges),
    );

    const badgeCount = userBadges.size;

    // Create notification for the new badge
    await createNotification(transaction, userId, {
      type: 'BADGE_EARNED',
      title: 'New Badge!',
      message: `You've earned a new badge!`,
      metadata: { badgeId },
    });

    // Check for badge collection achievements
    if (badgeCount === 5) {
      await recordAchievement(transaction, userId, {
        id: 'badge_collector',
        name: 'Badge Collector',
        description: 'Earned 5 different badges',
        timestamp: progressionEvent.timestamp,
      });
    } else if (badgeCount === 10) {
      await recordAchievement(transaction, userId, {
        id: 'badge_master',
        name: 'Badge Master',
        description: 'Earned 10 different badges',
        timestamp: progressionEvent.timestamp,
      });
    }
  });
});

// Helper function to record achievement within a transaction
async function recordAchievement(
  transaction: FirebaseFirestore.Transaction,
  userId: string,
  achievement: {
    id: string;
    name: string;
    description: string;
    timestamp: string;
  },
) {
  const db = DatabaseInstance.getInstance();
  const userRef = db.collection(Collections.Users).doc(userId);
  const achievementRef = userRef.collection(Collections.Achievements).doc(achievement.id);

  transaction.set(achievementRef, achievement);
  transaction.update(userRef, {
    'stats.achievements.total': FieldValue.increment(1),
    'stats.achievements.lastEarned': achievement.timestamp,
  });
}

// Helper function to create notification within a transaction
async function createNotification(
  transaction: FirebaseFirestore.Transaction,
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, any>;
  },
) {
  const db = DatabaseInstance.getInstance();

  const userRef = db.collection(Collections.Users).doc(userId);
  const notificationRef = userRef.collection(Collections.Notifications).doc();

  transaction.set(notificationRef, {
    id: notificationRef.id,
    ...notification,
    read: false,
    createdAt: new Date().toISOString(),
  });

  transaction.update(userRef, {
    'stats.notifications.unread': FieldValue.increment(1),
  });
}
