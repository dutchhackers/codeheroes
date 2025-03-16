import { GameActionContext, GameActionMetrics, GameActionType } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { ProgressionService } from '../services/progression.service';

/**
 * Base class for all game action handlers
 */
export abstract class AbstractActionHandler {
  /**
   * The action type this handler is responsible for
   */
  protected abstract actionType: GameActionType;

  /**
   * Create a new action handler
   * @param db Firestore instance
   */
  constructor(
    protected db: Firestore,
    protected progressionService: ProgressionService,
  ) {}

  /**
   * Calculate bonuses for the action based on context and metrics
   * @param context Action context containing details about where the action occurred
   * @param metrics Action metrics containing measurements about the action
   * @returns Calculated bonuses with breakdown
   */
  abstract calculateBonuses(
    context: GameActionContext,
    metrics?: GameActionMetrics,
  ): {
    totalBonus: number;
    breakdown: Record<string, number>;
  };

  /**
   * Get the action type handled by this handler
   * @returns The action type
   */
  getActionType(): GameActionType {
    return this.actionType;
  }
}
