import { getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { ActionResult, Activity, GameAction, ProgressionUpdate } from '@codeheroes/types';
import { ActionHandlerFactory } from '../../factories/action-handler.factory';
import { MilestoneRewardService } from './milestone-reward.service';
import { ProgressionStateService } from './progression-state.service';
import { ProgressionUpdateService } from './progression-update.service';

/**
 * Service focused on processing game actions and their effects on progression
 */
export class GameActionProcessorService {
  private updateService: ProgressionUpdateService;
  private stateService: ProgressionStateService;
  private milestoneService: MilestoneRewardService;

  constructor() {
    this.updateService = new ProgressionUpdateService();
    this.stateService = new ProgressionStateService();
    this.milestoneService = new MilestoneRewardService();
  }

  /**
   * Process a game action, updating progression and checking for milestones
   */
  async processGameAction(action: GameAction): Promise<ActionResult> {
    logger.info('Processing game action', {
      actionId: action.id,
      userId: action.userId,
      type: action.type,
    });

    try {
      // Get action handler and process the action
      const handler = ActionHandlerFactory.getHandler(action);
      const result = await handler.handle(action);

      // Get previous state before updating
      const previousState = await this.stateService.getProgressionState(action.userId);
      if (!previousState) {
        throw new Error('User state not found');
      }

      // Create activity object for tracking
      const activity = this.createActivityFromAction(action, result.xpGained);

      // Update progression with gained XP
      const update: ProgressionUpdate = {
        xpGained: result.xpGained,
        activityType: action.type,
      };

      // Update progression and get new state
      const updatedState = await this.updateService.updateProgression(action.userId, update, activity);

      // Check for milestones and grant rewards if needed
      await this.milestoneService.checkAndGrantMilestoneRewards(action.userId, updatedState, previousState, action);

      logger.info('Game action processed successfully', {
        actionId: action.id,
        xpGained: result.xpGained,
        newLevel: updatedState.level,
      });

      return {
        ...result,
        currentLevelProgress: updatedState,
      };
    } catch (error) {
      logger.error('Error processing game action', {
        actionId: action.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Creates an activity object from a game action to track XP rewards
   */
  private createActivityFromAction(action: GameAction, xpGained: number): Activity {
    return {
      id: `act_${Date.now()}_${action.id}`,
      userId: action.userId,
      type: 'game-action',
      sourceActionType: action.type,
      context: action.context,
      metrics: action.metrics,
      xp: {
        earned: xpGained,
        breakdown: [{ type: 'base', amount: xpGained, description: 'Base XP' }],
      },
      createdAt: getCurrentTimeAsISO(),
      updatedAt: getCurrentTimeAsISO(),
    };
  }
}
