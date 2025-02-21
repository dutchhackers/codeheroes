import { DatabaseInstance } from '@codeheroes/common';
import { Collections } from '@codeheroes/shared/types';
import { Firestore } from 'firebase-admin/firestore';
import { ProgressionState } from '../interfaces/progression';
import { ProgressionEventService } from './progression-event.service';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  xpReward: number;
  achievedAt?: string;
}

interface BadgeAwardResult {
  earnedBadges: Badge[];
  totalBadgeXP: number;
}

export class BadgeService {
  private db: Firestore;
  private progressionEvents: ProgressionEventService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.progressionEvents = new ProgressionEventService();
  }

  async processBadges(
    userId: string,
    context: {
      actionType: string;
      currentStreak?: number;
      totalActions?: number;
    },
  ): Promise<BadgeAwardResult> {
    const userRef = this.db.collection('users').doc(userId);
    const badgesRef = userRef.collection('badges');
    const existingBadges = new Set((await badgesRef.listDocuments()).map((doc) => doc.id));
    const earnedBadges: Badge[] = [];
    let totalBadgeXP = 0;

    // Check streak-based badges
    if (context.currentStreak) {
      const streakBadges = await this.checkStreakBadges(context.currentStreak, existingBadges);
      earnedBadges.push(...streakBadges);
    }

    // Check action-based badges
    if (context.totalActions) {
      const actionBadges = await this.checkActionBadges(context.actionType, context.totalActions, existingBadges);
      earnedBadges.push(...actionBadges);
    }

    // Get current user stats for progression state
    const userStatsDoc = await this.db.collection(Collections.UserStats).doc(userId).get();
    const userStats = userStatsDoc.data() as ProgressionState;

    // Award new badges
    for (const badge of earnedBadges) {
      await badgesRef.doc(badge.id).set({
        ...badge,
        achievedAt: new Date().toISOString(),
      });
      totalBadgeXP += badge.xpReward;

      // Emit badge earned event with current progression state
      await this.progressionEvents.emitBadgeEarned(userId, badge.id, userStats);
    }

    return { earnedBadges, totalBadgeXP };
  }

  private async checkStreakBadges(currentStreak: number, existingBadges: Set<string>): Promise<Badge[]> {
    const streakBadges: Badge[] = [];

    const streakMilestones = [
      { id: 'three_day_streak', name: '3-Day Streak', threshold: 3, xp: 1000 },
      { id: 'weekly_streak', name: 'Weekly Warrior', threshold: 7, xp: 3000 },
      { id: 'monthly_streak', name: 'Monthly Master', threshold: 30, xp: 10000 },
    ];

    for (const milestone of streakMilestones) {
      if (currentStreak >= milestone.threshold && !existingBadges.has(milestone.id)) {
        streakBadges.push({
          id: milestone.id,
          name: milestone.name,
          description: `Maintained a ${milestone.threshold}-day activity streak`,
          category: 'streak',
          xpReward: milestone.xp,
        });
      }
    }

    return streakBadges;
  }

  private async checkActionBadges(
    actionType: string,
    totalActions: number,
    existingBadges: Set<string>,
  ): Promise<Badge[]> {
    const actionBadges: Badge[] = [];

    const actionMilestones = [
      { id: `${actionType}_starter`, name: 'Getting Started', threshold: 1, xp: 500 },
      { id: `${actionType}_regular`, name: 'Regular Contributor', threshold: 10, xp: 2000 },
      { id: `${actionType}_expert`, name: 'Expert Contributor', threshold: 50, xp: 5000 },
    ];

    for (const milestone of actionMilestones) {
      if (totalActions >= milestone.threshold && !existingBadges.has(milestone.id)) {
        actionBadges.push({
          id: milestone.id,
          name: milestone.name,
          description: `Completed ${milestone.threshold} ${actionType} actions`,
          category: 'activity',
          xpReward: milestone.xp,
        });
      }
    }

    return actionBadges;
  }

  async getEarnedBadges(userId: string): Promise<Badge[]> {
    const badgesSnapshot = await this.db.collection('users').doc(userId).collection('badges').get();

    return badgesSnapshot.docs.map((doc) => doc.data() as Badge);
  }
}
