import { GameActionContext, GameActionMetrics, GameActionType } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { XP_VALUES } from '../../../config/xp-values.config';
import { AbstractActionHandler } from '../action-handler.base';

/**
 * Handler for code review actions
 */
export class CodeReviewSubmitHandler extends AbstractActionHandler {
  protected actionType: GameActionType = 'code_review_submit';

  constructor(protected db: Firestore) {
    super(db);
  }

  /**
   * Calculate bonuses for code review actions
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

    // Detailed review bonus (requires >=5 comments to trigger)
    if (metrics && 'commentsCount' in metrics && metrics.commentsCount >= 5) {
      bonuses.detailedReview = XP_VALUES.CODE_REVIEW.BONUSES.DETAILED_REVIEW;
      totalBonus += bonuses.detailedReview;
    }

    // Multiple files bonus (requires >8 files to trigger)
    if (metrics && 'filesReviewed' in metrics && metrics.filesReviewed > 8) {
      bonuses.multipleFiles = XP_VALUES.CODE_REVIEW.BONUSES.MULTIPLE_FILES;
      totalBonus += bonuses.multipleFiles;
    }

    // Thorough review bonus (based on suggestions made)
    if (metrics && 'suggestionsCount' in metrics && metrics.suggestionsCount > 0) {
      bonuses.thoroughReview = XP_VALUES.CODE_REVIEW.BONUSES.THOROUGH_REVIEW;
      totalBonus += bonuses.thoroughReview;
    }

    // Additional bonuses for high quality reviews
    if (context.type === 'code_review' && context.review.state === 'approved') {
      bonuses.approvalBonus = 50; // Bonus for approving the PR
      totalBonus += bonuses.approvalBonus;
    }

    return {
      totalBonus,
      breakdown: bonuses,
    };
  }
}
