import { GameActionContext, GameActionMetrics, GameActionType } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { XP_VALUES } from '../../../config/xp-values.config';
import { AbstractActionHandler } from '../action-handler.base';

/**
 * Handler for pull request actions (create, merge, close)
 */
export class PullRequestCreateHandler extends AbstractActionHandler {
  protected actionType: GameActionType;

  /**
   * Create a new pull request handler
   * @param db Firestore instance
   * @param action 'create', 'merge', or 'close'
   */
  constructor(
    protected db: Firestore,
    private action: 'create' | 'merge' | 'close',
  ) {
    super(db);

    // Set the action type based on the action parameter
    if (action === 'create') {
      this.actionType = 'pull_request_create';
    } else if (action === 'merge') {
      this.actionType = 'pull_request_merge';
    } else {
      this.actionType = 'pull_request_close';
    }
  }

  /**
   * Calculate bonuses for pull request actions
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

    // Get the correct bonus values based on action type
    let xpValues;
    if (this.actionType === 'pull_request_create') {
      xpValues = XP_VALUES.PULL_REQUEST.CREATE;
    } else if (this.actionType === 'pull_request_merge') {
      xpValues = XP_VALUES.PULL_REQUEST.MERGE;
    } else {
      xpValues = XP_VALUES.PULL_REQUEST.CLOSE;
    }

    // Multiple files bonus (requires >10 files to trigger)
    if (metrics && 'changedFiles' in metrics && metrics.changedFiles > 10) {
      bonuses.multipleFiles = xpValues.BONUSES.MULTIPLE_FILES;
      totalBonus += bonuses.multipleFiles;
    }

    // Significant changes bonus (requires >500 total changes to trigger)
    if (metrics && 'additions' in metrics && 'deletions' in metrics) {
      const totalChanges = metrics.additions + metrics.deletions;
      if (totalChanges > 500) {
        bonuses.significantChanges = xpValues.BONUSES.SIGNIFICANT_CHANGES;
        totalBonus += bonuses.significantChanges;
      }
    }

    // Additional metrics-based bonuses could be added here

    return {
      totalBonus,
      breakdown: bonuses,
    };
  }
}
