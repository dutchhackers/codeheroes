import { GameActionContext, GameActionMetrics, GameActionType } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { XP_VALUES } from '../../../config/xp-values.config';
import { AbstractActionHandler } from '../action-handler.base';

/**
 * Handler for CI/CD workflow run success actions
 */
export class WorkflowRunHandler extends AbstractActionHandler {
  protected actionType: GameActionType = 'ci_success';

  constructor(protected db: Firestore) {
    super(db);
  }

  /**
   * Calculate bonuses for workflow run actions
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

    // Deployment workflow bonus
    if (metrics && 'isDeployment' in metrics && metrics.isDeployment) {
      bonuses.deployment = XP_VALUES.WORKFLOW.SUCCESS.BONUSES.DEPLOYMENT;
      totalBonus += bonuses.deployment;
    }

    return {
      totalBonus,
      breakdown: bonuses,
    };
  }
}
