import { GameActionContext, GameActionMetrics, GameActionType } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { XP_VALUES } from '../../../config/xp-values.config';
import { AbstractActionHandler } from '../action-handler.base';
import { ProgressionService } from '../../services/progression.service';

/**
 * Handler for pull request review comment actions (inline code comments)
 */
export class ReviewCommentHandler extends AbstractActionHandler {
  protected actionType: GameActionType = 'review_comment_create';

  constructor(
    protected db: Firestore,
    protected progressionService: ProgressionService,
  ) {
    super(db, progressionService);
  }

  /**
   * Calculate bonuses for review comment actions
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

    // With suggestion bonus (for comments containing ```suggestion blocks)
    if (metrics && 'hasSuggestion' in metrics && metrics.hasSuggestion) {
      bonuses.withSuggestion = XP_VALUES.REVIEW_COMMENT.BONUSES.WITH_SUGGESTION;
      totalBonus += bonuses.withSuggestion;
    }

    // Detailed comment bonus (for comments with bodyLength > 150)
    if (metrics && 'bodyLength' in metrics && metrics.bodyLength > 150) {
      bonuses.detailed = XP_VALUES.REVIEW_COMMENT.BONUSES.DETAILED;
      totalBonus += bonuses.detailed;
    }

    return {
      totalBonus,
      breakdown: bonuses,
    };
  }
}
