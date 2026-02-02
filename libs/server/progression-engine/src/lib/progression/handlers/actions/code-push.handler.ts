import { GameActionContext, GameActionMetrics, GameActionType } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { XP_VALUES } from '../../../config/xp-values.config';
import { AbstractActionHandler } from '../action-handler.base';
import { ProgressionService } from '../../services/progression.service';

/**
 * Handler for code push actions
 */
export class CodePushHandler extends AbstractActionHandler {
  protected actionType: GameActionType = 'code_push';

  constructor(
    protected db: Firestore,
    protected progressionService: ProgressionService,
  ) {
    super(db, progressionService);
  }

  /**
   * Calculate bonuses for code push actions
   * @param context Action context
   * @param metrics Action metrics
   * @returns Calculated bonuses
   */
  calculateBonuses(
    context: GameActionContext,
    metrics?: GameActionMetrics,
  ): {
    totalBonus: number;
    breakdown: Record<string, number>;
  } {
    const bonuses: Record<string, number> = {};
    let totalBonus = 0;

    // Extract commit count from metrics if available
    const commitCount = metrics && 'commitCount' in metrics ? metrics.commitCount : 1;

    // Multiple commits bonus (requires >=5 commits to trigger)
    if (commitCount >= 5) {
      bonuses.multipleCommits = XP_VALUES.CODE_PUSH.BONUSES.MULTIPLE_COMMITS;
      totalBonus += bonuses.multipleCommits;
    }

    // Branch creation bonus
    if (context.type === 'code_push' && context.isNew) {
      bonuses.newBranch = 100; // Bonus for creating a new branch
      totalBonus += bonuses.newBranch;
    }

    // Additional bonuses could be added here based on other metrics

    return {
      totalBonus,
      breakdown: bonuses,
    };
  }
}
