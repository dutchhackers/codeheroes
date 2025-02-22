import { DatabaseInstance, logger } from '@codeheroes/common';
import { NotificationService } from '@codeheroes/notifications';
import { Collections, GameActionType } from '@codeheroes/shared/types';
import { Firestore } from 'firebase-admin/firestore';
import { getXpProgress } from '../../constants/level-thresholds';
import { ActionHandlerFactory } from '../../factories/action-handler.factory';
import { ProgressionEventService } from '../events/event-types';
import { ActionResult, GameAction } from '../interfaces/action';
import { Activity, ActivityStats } from '../interfaces/activity';
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

  constructor(badgeService?: BadgeService) {
    this.db = DatabaseInstance.getInstance();
    this.eventService = new ProgressionEventService();
    this.levelService = new LevelService();
    this.badgeService = badgeService || new BadgeService();
    this.rewardService = new RewardService(this.badgeService);
    this.notificationService = new NotificationService();
  }

  async processGameAction(action: GameAction): Promise<ActionResult> {
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
        timestamp: new Date().toISOString(),
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

  private shouldCheckForMilestoneRewards(action: GameAction, state: ProgressionState): boolean {
    return (
      state.level > (state as any).previousLevel || // Level up occurred
      this.isActivityMilestone(action, state)
    );
  }

  private isActivityMilestone(action: GameAction, state: ProgressionState): boolean {
    const activityCount = state.activityStats?.byType?.[action.actionType] || 0;
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

  async updateProgression(userId: string, update: ProgressionUpdate, activity?: Activity): Promise<ProgressionState> {
    logger.info('Starting progression update', { userId, xpGained: update.xpGained });
    const userStatsRef = this.db.collection(Collections.UserStats).doc(userId);

    return await this.db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userStatsRef);
      const now = new Date().toISOString();

      const initialActivityStats: ActivityStats = {
        total: 0,
        byType: {
          code_push: 0,
          pull_request_create: 0,
          pull_request_merge: 0,
          pull_request_close: 0,
        },
      };

      const initialState: ProgressionState = {
        userId,
        xp: 0,
        level: 1,
        currentLevelXp: 0,
        xpToNextLevel: 1000,
        achievements: [],
        lastActivityDate: null,
        activityStats: initialActivityStats,
      };

      // If user stats don't exist, create them
      if (!userDoc.exists) {
        transaction.set(userStatsRef, {
          ...initialState,
          createdAt: now,
          updatedAt: now,
        });
      }

      const previousState: ProgressionState = userDoc.exists ? (userDoc.data() as ProgressionState) : initialState;
      const newTotalXp = previousState.xp + update.xpGained;

      const { currentLevel, currentLevelXp, xpToNextLevel } = getXpProgress(newTotalXp);

      const newState: ProgressionState = {
        userId,
        xp: newTotalXp,
        level: currentLevel,
        currentLevelXp,
        xpToNextLevel,
        achievements: [...(previousState.achievements || []), ...(update.achievements || [])],
        lastActivityDate: now.split('T')[0],
        activityStats: previousState.activityStats || initialActivityStats,
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
      if (userDoc.exists) {
        transaction.update(userStatsRef, updateData);
      } else {
        transaction.set(userStatsRef, {
          ...updateData,
          createdAt: now,
        });
      }

      // Update activity stats if there's an activity
      if (activity) {
        const activityStatsRef = userStatsRef.collection(Collections.UserStats_Activities).doc();
        transaction.set(activityStatsRef, {
          ...activity,
          createdAt: now,
        });
      }

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

    const initialActivityStats: ActivityStats = {
      total: 0,
      byType: {
        code_push: 0,
        pull_request_create: 0,
        pull_request_merge: 0,
        pull_request_close: 0,
      },
    };

    return {
      userId,
      xp: userStats.xp || 0,
      level: currentLevel,
      currentLevelXp,
      xpToNextLevel,
      achievements: userStats.achievements || [],
      lastActivityDate: userStats.lastActivityDate,
      activityStats: userStats.activityStats || initialActivityStats,
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
