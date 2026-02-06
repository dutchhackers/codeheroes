import { GameActionContext, GameActionMetrics, GameActionType } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { XP_VALUES } from '../../../config/xp-values.config';
import { AbstractActionHandler } from '../action-handler.base';

/**
 * Handler for comment actions (issue and PR comments)
 */
export class CommentHandler extends AbstractActionHandler {
  protected actionType: GameActionType = 'comment_create';

  constructor(protected db: Firestore) {
    super(db);
  }

  /**
   * Calculate bonuses for comment actions
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

    // Detailed comment bonus (for comments with bodyLength > 100)
    if (metrics && 'bodyLength' in metrics && metrics.bodyLength > 100) {
      bonuses.detailedComment = XP_VALUES.COMMENT.BONUSES.DETAILED_COMMENT;
      totalBonus += bonuses.detailedComment;
    }

    return {
      totalBonus,
      breakdown: bonuses,
    };
  }
}
