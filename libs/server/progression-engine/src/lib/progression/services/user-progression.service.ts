import { logger } from '@codeheroes/common';
import { ActionResult, Activity, GameAction, ProgressionState, ProgressionUpdate } from '@codeheroes/types';
import { GameActionProcessorService } from './game-action-processor.service';
import { ProgressionStateService } from './progression-state.service';
import { ProgressionUpdateService } from './progression-update.service';

/**
 * Primary service for managing user progression
 * Acts as a facade to coordinate between more specialized services
 */
export class UserProgressionService {
  private actionProcessor: GameActionProcessorService;
  private progressionUpdater: ProgressionUpdateService;
  private stateService: ProgressionStateService;

  constructor() {
    this.actionProcessor = new GameActionProcessorService();
    this.progressionUpdater = new ProgressionUpdateService();
    this.stateService = new ProgressionStateService();
  }

  /**
   * Process a game action and update user progression
   */
  async processGameAction(action: GameAction): Promise<ActionResult> {
    try {
      return await this.actionProcessor.processGameAction(action);
    } catch (error) {
      logger.error('Error in processGameAction', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update a user's progression with XP changes
   */
  async updateProgression(userId: string, update: ProgressionUpdate, activity?: Activity): Promise<ProgressionState> {
    try {
      return await this.progressionUpdater.updateProgression(userId, update, activity);
    } catch (error) {
      logger.error('Error in updateProgression', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get the current progression state for a user
   */
  async getProgressionState(userId: string): Promise<ProgressionState | null> {
    try {
      return await this.stateService.getProgressionState(userId);
    } catch (error) {
      logger.error('Error in getProgressionState', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
