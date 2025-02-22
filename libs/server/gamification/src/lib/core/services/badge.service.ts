import { DatabaseInstance } from '@codeheroes/common';
import { Collections } from '@codeheroes/shared/types';
import { Firestore } from 'firebase-admin/firestore';
import { UnifiedEventHandlerService } from '../../core/events/unified-event-handler.service';
import { Activity } from '../interfaces/activity';

export interface Badge {
  id: string;
  name: string;
  description?: string;
  earnedAt?: string;
  xp?: number;
}

interface BadgeContext {
  totalActions: number;
  actionType: string;
  metadata?: Record<string, any>;
}

export class BadgeService {
  private db: Firestore;
  private eventHandler: UnifiedEventHandlerService;

  constructor(eventHandler?: UnifiedEventHandlerService) {
    this.db = DatabaseInstance.getInstance();
    this.eventHandler = eventHandler || new UnifiedEventHandlerService();
  }

  async processBadges(userId: string, context: BadgeContext): Promise<Badge[]> {
    const userRef = this.db.collection(Collections.Users).doc(userId);
    const badgesRef = userRef.collection(Collections.User_UserBadges);
    const badgeSnapshot = await badgesRef.get();
    const existingBadges = new Set(badgeSnapshot.docs.map((doc) => doc.id));
    const earnedBadges: Badge[] = [];

    // Check activity-based badges
    const activityBadges = await this.checkActivityBadges(context.actionType, context.totalActions, existingBadges);
    earnedBadges.push(...activityBadges);

    // Save earned badges
    for (const badge of earnedBadges) {
      await badgesRef.doc(badge.id).set({
        ...badge,
        earnedAt: new Date().toISOString(),
      });
    }

    return earnedBadges;
  }

  private async checkActivityBadges(
    actionType: string,
    totalActions: number,
    existingBadges: Set<string>,
  ): Promise<Badge[]> {
    const activityBadges: Badge[] = [];
    const milestones = [
      { id: 'first_action', name: 'First Steps', threshold: 1, xp: 100 },
      { id: 'ten_actions', name: 'Getting Started', threshold: 10, xp: 500 },
      { id: 'fifty_actions', name: 'Regular Contributor', threshold: 50, xp: 2000 },
      { id: 'hundred_actions', name: 'Dedicated Developer', threshold: 100, xp: 5000 },
    ];

    for (const milestone of milestones) {
      if (totalActions >= milestone.threshold && !existingBadges.has(milestone.id)) {
        activityBadges.push({
          id: milestone.id,
          name: milestone.name,
          description: `Complete ${milestone.threshold} ${actionType} actions`,
          xp: milestone.xp,
        });
      }
    }

    return activityBadges;
  }
}
