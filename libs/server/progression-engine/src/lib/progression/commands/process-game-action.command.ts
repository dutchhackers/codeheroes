import { logger } from '@codeheroes/common';
import { GameAction, ActionResult } from '@codeheroes/types';
import { ProgressionService } from '../services/progression.service';
import { GameActionRepository } from '../repositories/game-action.repository';

/**
 * Command interface for the command pattern
 */
export interface Command<T> {
  execute(): Promise<T>;
}

/**
 * Command for processing a game action
 * Implements command pattern for better encapsulation and testability
 */
export class ProcessGameActionCommand implements Command<ActionResult> {
  constructor(
    private action: GameAction,
    private progressionService: ProgressionService,
    private gameActionRepository: GameActionRepository,
  ) {}

  /**
   * Execute the command to process a game action
   * @returns Action processing result
   */
  async execute(): Promise<ActionResult> {
    const { id, type, userId } = this.action;

    logger.info(`Executing process game action command`, {
      actionId: id,
      actionType: type,
      userId,
    });

    try {
      // Process the action
      const result = await this.progressionService.processGameAction(this.action);

      // Mark action as processed
      await this.gameActionRepository.markAsProcessed(id);

      logger.info(`Game action processed successfully`, {
        actionId: id,
        xpGained: result.xpGained,
        newLevel: result.level,
      });

      return result;
    } catch (error) {
      logger.error(`Error processing game action`, {
        actionId: id,
        error: error instanceof Error ? error.message : String(error),
      });

      // Mark action as failed
      await this.gameActionRepository.markAsFailed(id, error instanceof Error ? error.message : 'Unknown error');

      throw error;
    }
  }
}
