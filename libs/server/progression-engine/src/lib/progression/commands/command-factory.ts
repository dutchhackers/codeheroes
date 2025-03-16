// File: libs/server/progression-engine/src/lib/progression/commands/command-factory.ts

import { GameAction } from '@codeheroes/types';
import { ProgressionService } from '../services/progression.service';
import { GameActionRepository } from '../repositories/game-action.repository';
import { ProgressionUpdate } from '../core/progression-state.model';
import { Command, ProcessGameActionCommand } from './process-game-action.command';
import { UpdateProgressionCommand } from './update-progression.command';

/**
 * Factory for creating command objects
 * Centralizes command creation and dependency injection
 */
export class CommandFactory {
  constructor(
    private progressionService: ProgressionService,
    private gameActionRepository: GameActionRepository,
  ) {}

  /**
   * Create a command to process a game action
   * @param action The game action to process
   * @returns Command object that can be executed
   */
  createProcessGameActionCommand(action: GameAction): Command<any> {
    return new ProcessGameActionCommand(action, this.progressionService, this.gameActionRepository);
  }

  /**
   * Create a command to update user progression
   * @param userId User ID to update
   * @param update The progression update to apply
   * @returns Command object that can be executed
   */
  createUpdateProgressionCommand(userId: string, update: ProgressionUpdate): Command<any> {
    return new UpdateProgressionCommand(userId, update, this.progressionService);
  }
}
