import { GameActionType } from '@codeheroes/types';
import { BaseActionHandler } from '../base/abstract-action.handler';
import { XP_SETTINGS } from '../../constants/xp-values.config';

export class CodeReviewSubmitHandler extends BaseActionHandler {
  protected actionType: GameActionType = 'code_review_submit';

  protected calculateBaseXp(): number {
    return XP_SETTINGS.CODE_REVIEW.BASE;
  }

  protected calculateBonuses(metadata: Record<string, any>) {
    const bonuses: Record<string, number> = {};
    let totalBonus = 0;

    // Bonus for detailed review with substantial comments
    if (metadata.commentCount >= 3) {
      bonuses.detailedReview = XP_SETTINGS.CODE_REVIEW.BONUSES.DETAILED_REVIEW;
      totalBonus += bonuses.detailedReview;
    }

    // Bonus for reviewing changes across multiple files
    if (metadata.filesReviewed > 3) {
      bonuses.multipleFiles = XP_SETTINGS.CODE_REVIEW.BONUSES.MULTIPLE_FILES;
      totalBonus += bonuses.multipleFiles;
    }

    // Bonus for thorough reviews with suggestions
    if (metadata.suggestions && metadata.suggestions > 0) {
      bonuses.thoroughReview = XP_SETTINGS.CODE_REVIEW.BONUSES.THOROUGH_REVIEW;
      totalBonus += bonuses.thoroughReview;
    }

    return {
      totalBonus,
      breakdown: bonuses,
    };
  }

  protected getAdditionalBadgeContext(stats: FirebaseFirestore.DocumentData): Record<string, any> {
    return {
      totalReviews: stats.totalReviews + 1,
    };
  }
}
