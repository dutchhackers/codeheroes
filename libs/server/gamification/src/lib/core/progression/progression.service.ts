import { DatabaseInstance, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { NotificationService } from '@codeheroes/notifications';
import { ActionResult, Collections } from '@codeheroes/shared/types';
import { Firestore } from 'firebase-admin/firestore';
import { getXpProgress } from '../../constants/level-thresholds';
import { ActionHandlerFactory } from '../../factories/action-handler.factory';
import { ActivityService } from '../activity/activity.service';
import { ProgressionEventService } from '../events/event-types';
import { LegacyGameAction } from '../interfaces/action';
import { Activity } from '../interfaces/activity';
import { ProgressionState, ProgressionUpdate } from '../interfaces/progression';
import { BadgeService } from '../services/badge.service';
import { LevelService } from '../services/level.service';
import { RewardService } from '../services/reward.service';

export class ProgressionService {
  private db: Firestore;
  private eventService: ProgressionEventService;
  private levelService: LevelService;
  private badgeService: BadgeService;
  private rewardService: RewardService;
  private notificationService: NotificationService;
  private activityService: ActivityService;

  constructor(badgeService?: BadgeService) {
    this.db = DatabaseInstance.getInstance();
    this.eventService = new ProgressionEventService();
    this.levelService = new LevelService();
    this.badgeService = badgeService || new BadgeService();
    this.rewardService = new RewardService(this.badgeService);
    this.notificationService = new NotificationService();
    this.activityService = new ActivityService();
  }

  async processGameAction(action: LegacyGameAction): Promise<ActionResult> {
    const handler = ActionHandlerFactory.getHandler(action);
    const result = await handler.handle(action);

    // Get current state
    const currentState = await this.getProgressionState(action.userId);
    if (!currentState) {
      throw new Error('User state not found');
    }

    // Process XP gain and progression
    const updatedState = await this.updateProgression(
      action.userId,
      {
        xpGained: result.xpGained,
        activityType: action.actionType,
      },
      {
        id: this.generateId(),
        userId: action.userId,
        type: action.actionType,
        metadata: action.metadata,
        xp: {
          earned: result.xpGained,
          breakdown: [{ type: 'base', amount: result.xpGained, description: 'Base XP' }],
        },
        createdAt: getCurrentTimeAsISO(),
        updatedAt: getCurrentTimeAsISO(),
      },
    );

    // Check for milestone achievements and special rewards
    if (this.shouldCheckForMilestoneRewards(action, updatedState)) {
      await this.processMilestoneRewards(action.userId, updatedState);
    }

    return {
      ...result,
      currentLevelProgress: updatedState,
    };
  }

  async updateProgression(userId: string, update: ProgressionUpdate, activity?: Activity): Promise<ProgressionState> {
    logger.info('Starting progression update', { userId, xpGained: update.xpGained });
    const userRef = this.db.collection(Collections.Users).doc(userId);
    const statsRef = userRef.collection(Collections.Stats).doc('current');

    return await this.db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(statsRef);
      const now = new Date().toISOString();

      const initialStats = await this.activityService.getActivityStats(userId);

      const initialState: ProgressionState = {
        userId,
        xp: 0,
        level: 1,
        currentLevelXp: 0,
        xpToNextLevel: 1000,
        lastActivityDate: null,
        counters: initialStats.counters,
        countersLastUpdated: initialStats.countersLastUpdated,
      };

      // If user stats don't exist, create them
      if (!userDoc.exists) {
        await statsRef.set({
          ...initialState,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Re-get the stats doc if we just created it
      const currentDoc = userDoc.exists ? userDoc : await statsRef.get();
      const previousState: ProgressionState = currentDoc.exists
        ? (currentDoc.data() as ProgressionState)
        : initialState;

      // Calculate new XP
      const newTotalXp = (previousState.xp || 0) + update.xpGained;
      const { currentLevel, currentLevelXp, xpToNextLevel } = getXpProgress(newTotalXp);

      const newState: ProgressionState = {
        userId,
        xp: newTotalXp,
        level: currentLevel,
        currentLevelXp,
        xpToNextLevel,
        lastActivityDate: now.split('T')[0],
        counters: previousState.counters || initialState.counters,
        countersLastUpdated: previousState.countersLastUpdated || now,
      };

      // Emit progression events
      if (activity) {
        await this.eventService.emitXpGained(userId, activity, newState, previousState);
      }

      if (currentLevel > previousState.level) {
        await this.eventService.emitLevelUp(userId, newState, previousState);
      }

      const updateData = {
        ...newState,
        updatedAt: now,
      };

      // Update or create the user stats document
      transaction.set(statsRef, updateData);

      return newState;
    });
  }

  async getProgressionState(userId: string): Promise<ProgressionState | null> {
    const statsDoc = await this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Stats)
      .doc('current')
      .get();

    if (!statsDoc.exists) {
      return null;
    }

    const userStats = statsDoc.data()!;
    const { currentLevel, currentLevelXp, xpToNextLevel } = getXpProgress(userStats.xp || 0);

    // Get initial stats with counters
    const initialStats = await this.activityService.getActivityStats(userId);

    return {
      userId,
      xp: userStats.xp || 0,
      level: currentLevel,
      currentLevelXp,
      xpToNextLevel,
      lastActivityDate: userStats.lastActivityDate,
      counters: userStats.counters || initialStats.counters,
      countersLastUpdated: userStats.countersLastUpdated || initialStats.countersLastUpdated,
    };
  }

  private shouldCheckForMilestoneRewards(action: LegacyGameAction, state: ProgressionState): boolean {
    return (
      state.level > (state as any).previousLevel || // Level up occurred
      this.isActivityMilestone(action, state)
    );
  }

  private isActivityMilestone(action: LegacyGameAction, state: ProgressionState): boolean {
    const activityCount = state.counters?.[action.actionType] || 0;
    const milestones = [10, 50, 100, 500];
    return milestones.includes(activityCount);
  }

  private async processMilestoneRewards(userId: string, state: ProgressionState): Promise<void> {
    const levelConfig = this.levelService.getNextLevelRequirements(state.level - 1);

    if (levelConfig.rewards) {
      for (const reward of levelConfig.rewards) {
        await this.rewardService.grantReward(userId, {
          id: this.generateId(),
          type: reward.type,
          name: reward.name,
          amount: reward.amount,
        });
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
