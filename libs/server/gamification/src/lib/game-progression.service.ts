import { DatabaseInstance, logger } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { GameActionType } from '@codeheroes/shared/types';
import { Firestore } from 'firebase-admin/firestore';
import { ActionResult, GameAction } from './core/interfaces/action';
import { RewardType } from './core/interfaces/level';
import { StreakType } from './core/interfaces/streak';
import { BadgeService } from './core/services/badge.service';
import { LevelService } from './core/services/level.service';
import { NotificationService } from './core/services/notification.service';
import { ProgressionEventService } from './core/services/progression-event.service';
import { ProgressionService } from './core/services/progression.service';
import { RewardService } from './core/services/reward.service';
import { GameProgressionStateMachine } from './core/state-machine/progression-state-machine';
import { EventService } from './events/event.service';
import { ActionHandlerFactory } from './factories/action-handler.factory';

export class GameProgressionService {
  private db: Firestore;
  private eventService: EventService;
  private progressionService: ProgressionService;
  private stateMachine: GameProgressionStateMachine;
  private rewardService: RewardService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.eventService = new EventService();
    this.progressionService = new ProgressionService();
    this.rewardService = new RewardService();
  }

  async processGameAction(action: GameAction): Promise<ActionResult> {
    const handler = ActionHandlerFactory.getHandler(action);
    const result = await handler.handle(action);

    // Get user's current state
    const currentState = await this.progressionService.getProgressionState(action.userId);
    if (!currentState) {
      throw new Error('User state not found');
    }

    // Initialize state machine with current state
    this.stateMachine = new GameProgressionStateMachine(
      currentState,
      new LevelService(),
      new BadgeService(),
      new ProgressionEventService(),
      new NotificationService(),
    );

    // Process XP gain
    await this.stateMachine.handleXpGain(result.xpGained, {
      id: this.generateId(),
      userId: action.userId,
      type: action.actionType,
      metadata: action.metadata,
      xp: {
        earned: result.xpGained,
        breakdown: [{ type: 'base', amount: result.xpGained, description: 'Base XP' }],
      },
      timestamp: new Date().toISOString(),
    });

    // Process streak if applicable
    if (result.newStreak) {
      await this.stateMachine.handleStreakUpdate(this.getStreakTypeFromAction(action.actionType), result.newStreak);
    }

    // Process any rewards from the action
    if (result.rewards) {
      for (const [rewardType, rewardValue] of Object.entries(result.rewards)) {
        await this.rewardService.grantReward(action.userId, {
          id: this.generateId(),
          type: rewardType as RewardType,
          name: `${action.actionType} reward`,
          amount: typeof rewardValue === 'number' ? rewardValue : undefined,
          metadata: typeof rewardValue === 'object' ? rewardValue : undefined,
        });
      }
    }

    return {
      ...result,
      currentLevelProgress: this.stateMachine.getState(),
    };
  }

  async handleNewEvent(event: Event): Promise<GameAction | null> {
    try {
      return await this.eventService.handleNewEvent(event);
    } catch (error) {
      logger.error('Error handling event:', error);
      return null;
    }
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
