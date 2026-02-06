import { GameActionContext, GameActionMetrics, GameActionType } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { XP_VALUES } from '../../../config/xp-values.config';
import { AbstractActionHandler } from '../action-handler.base';

/**
 * Handler for issue actions (create, close, reopen)
 */
export class IssueHandler extends AbstractActionHandler {
  protected actionType: GameActionType;

  /**
   * Create a new issue handler
   * @param db Firestore instance
   * @param action 'create', 'close', or 'reopen'
   */
  constructor(
    protected db: Firestore,
    private action: 'create' | 'close' | 'reopen',
  ) {
    super(db);

    // Set the action type based on the action parameter
    if (action === 'create') {
      this.actionType = 'issue_create';
    } else if (action === 'close') {
      this.actionType = 'issue_close';
    } else {
      this.actionType = 'issue_reopen';
    }
  }

  /**
   * Calculate bonuses for issue actions
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
    if (this.actionType === 'issue_create') {
      xpValues = XP_VALUES.ISSUE.CREATE;
    } else if (this.actionType === 'issue_close') {
      xpValues = XP_VALUES.ISSUE.CLOSE;
    } else {
      xpValues = XP_VALUES.ISSUE.REOPEN;
    }

    // Detailed description bonus (for issue creation)
    if (this.actionType === 'issue_create' && metrics && 'bodyLength' in metrics && metrics.bodyLength > 200) {
      bonuses.detailedDescription = xpValues.BONUSES.DETAILED_DESCRIPTION;
      totalBonus += bonuses.detailedDescription;
    }

    // Labels bonus (for issue creation)
    if (this.actionType === 'issue_create' && metrics && 'labels' in metrics && metrics.labels && metrics.labels > 0) {
      bonuses.withLabels = xpValues.BONUSES.WITH_LABELS;
      totalBonus += bonuses.withLabels;
    }

    // Referenced in PR bonus (for issue closure)
    if (
      this.actionType === 'issue_close' &&
      context.type === 'issue' &&
      context.linkedPRs &&
      context.linkedPRs.length > 0
    ) {
      bonuses.referencedInPR = xpValues.BONUSES.REFERENCED_IN_PR;
      totalBonus += bonuses.referencedInPR;
    }

    // With updates bonus (for issue reopen)
    if (
      this.actionType === 'issue_reopen' &&
      metrics &&
      'updatedWithNewInfo' in metrics &&
      metrics.updatedWithNewInfo
    ) {
      bonuses.withUpdates = xpValues.BONUSES.WITH_UPDATES;
      totalBonus += bonuses.withUpdates;
    }

    return {
      totalBonus,
      breakdown: bonuses,
    };
  }
}
