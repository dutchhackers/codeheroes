import { DatabaseInstance, logger } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { NotificationService } from '@codeheroes/notifications';
import { Collections, GameActionType } from '@codeheroes/shared/types';
import { Firestore } from 'firebase-admin/firestore';
import { ActionResult, GameAction } from '../interfaces/action';
import { Activity } from '../interfaces/activity';
import { ProgressionState, ProgressionUpdate } from '../interfaces/progression';
import { StreakType } from '../interfaces/streak';
import { BadgeService } from '../services/badge.service';
import { LevelService } from '../services/level.service';
import { RewardService } from '../services/reward.service';
import { ActionHandlerFactory } from '../../factories/action-handler.factory';
import { ProgressionEventService } from '../events/event-types';
import { getXpProgress } from '../../constants/level-thresholds';

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

    // Process XP gain
    await this.updateProgression(
      action.userId,
      {
        xpGained: result.xpGained,
        activityType: action.actionType,
        streakUpdates: result.newStreak
          ? {
              [StreakType.CodePush]: action.actionType === 'code_push' ? result.newStreak : 0,
              [StreakType.PullRequestCreate]: action.actionType === 'pull_request_create' ? result.newStreak : 0,
              [StreakType.PullRequestClose]: action.actionType === 'pull_request_close' ? result.newStreak : 0,
              [StreakType.PullRequestMerge]: action.actionType === 'pull_request_merge' ? result.newStreak : 0,
            }
          : undefined,
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

    // Process rewards if any
    if (result.rewards) {
      for (const [rewardType, rewardValue] of Object.entries(result.rewards)) {
        await this.rewardService.grantReward(action.userId, {
          id: this.generateId(),
          type: rewardType as any,
          name: `${action.actionType} reward`,
          amount: typeof rewardValue === 'number' ? rewardValue : undefined,
          metadata: typeof rewardValue === 'object' ? rewardValue : undefined,
        });
      }
    }

    const updatedState = await this.getProgressionState(action.userId);
    return {
      ...result,
      currentLevelProgress: updatedState || undefined,
    };
  }

  async updateProgression(userId: string, update: ProgressionUpdate, activity?: Activity): Promise<ProgressionState> {
    logger.info('Starting progression update', { userId, xpGained: update.xpGained });
    const userStatsRef = this.db.collection(Collections.UserStats).doc(userId);

    return await this.db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userStatsRef);
      const now = new Date().toISOString();

      const initialState: ProgressionState = {
        userId,
        xp: 0,
        level: 1,
        currentLevelXp: 0,
        xpToNextLevel: 1000,
        streaks: {
          [StreakType.CodePush]: 0,
          [StreakType.PullRequestCreate]: 0,
          [StreakType.PullRequestClose]: 0,
          [StreakType.PullRequestMerge]: 0,
        },
        achievements: [],
        lastActivityDate: null,
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
        streaks: {
          ...previousState.streaks,
          ...update.streakUpdates,
        },
        achievements: [...(previousState.achievements || []), ...(update.achievements || [])],
        lastActivityDate: now.split('T')[0],
      };

      // Emit progression events
      if (activity) {
        await this.eventService.emitXpGained(userId, activity, newState, previousState);
      }

      if (currentLevel > previousState.level) {
        await this.eventService.emitLevelUp(userId, newState, previousState);
      }

      if (update.streakUpdates) {
        await this.eventService.emitStreakUpdated(userId, newState, previousState);
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

    return {
      userId,
      xp: userStats.xp || 0,
      level: currentLevel,
      currentLevelXp,
      xpToNextLevel,
      streaks: userStats.streaks || {
        [StreakType.CodePush]: 0,
        [StreakType.PullRequestCreate]: 0,
        [StreakType.PullRequestClose]: 0,
        [StreakType.PullRequestMerge]: 0,
      },
      achievements: userStats.achievements || [],
      lastActivityDate: userStats.lastActivityDate,
    };
  }

  private getStreakTypeFromAction(actionType: GameActionType): StreakType {
    switch (actionType) {
      case 'code_push':
        return StreakType.CodePush;
      case 'pull_request_create':
        return StreakType.PullRequestCreate;
      case 'pull_request_close':
        return StreakType.PullRequestClose;
      case 'pull_request_merge':
        return StreakType.PullRequestMerge;
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
