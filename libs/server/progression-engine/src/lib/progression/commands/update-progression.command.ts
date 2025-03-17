import { logger } from '@codeheroes/common';
import { ActionResult } from '@codeheroes/types';
import { ProgressionService } from '../services/progression.service';
import { ProgressionUpdate } from '../core/progression-state.model';
import { Command } from './process-game-action.command';

/**
 * Command for manually updating user progression
 * Implements command pattern for better encapsulation and testability
 */
export class UpdateProgressionCommand implements Command<ActionResult> {
  constructor(
    private userId: string,
    private update: ProgressionUpdate,
    private progressionService: ProgressionService,
  ) {}

  /**
   * Execute the command to update user progression
   * @returns Action result with updated progression details
   */
  async execute(): Promise<ActionResult> {
    logger.info(`Executing update progression command`, {
      userId: this.userId,
      xpGained: this.update.xpGained,
      activityType: this.update.activityType,
    });

    try {
      // Update progression through the service
      const result = await this.progressionService.updateProgression(this.userId, this.update);

      logger.info(`Progression updated successfully`, {
        userId: this.userId,
        xpGained: this.update.xpGained,
        newLevel: result.level,
      });

      return result;
    } catch (error) {
      logger.error(`Error updating progression`, {
        userId: this.userId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }
}
