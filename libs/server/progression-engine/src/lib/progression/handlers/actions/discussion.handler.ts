import { GameActionContext, GameActionMetrics, GameActionType } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { XP_VALUES } from '../../../config/xp-values.config';
import { AbstractActionHandler } from '../action-handler.base';
import { ProgressionService } from '../../services/progression.service';

/**
 * Handler for discussion actions (create and comment)
 */
export class DiscussionHandler extends AbstractActionHandler {
  protected actionType: GameActionType;

  /**
   * Create a new discussion handler
   * @param db Firestore instance
   * @param progressionService Progression service instance
   * @param action 'create' or 'comment'
   */
  constructor(
    protected db: Firestore,
    protected progressionService: ProgressionService,
    private action: 'create' | 'comment',
  ) {
    super(db, progressionService);

    // Set the action type based on the action parameter
    if (action === 'create') {
      this.actionType = 'discussion_create';
    } else {
      this.actionType = 'discussion_comment';
    }
  }

  /**
   * Calculate bonuses for discussion actions
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

    if (this.action === 'create') {
      // Detailed discussion bonus (for discussions with bodyLength > 300)
      if (metrics && 'bodyLength' in metrics && metrics.bodyLength > 300) {
        bonuses.detailed = XP_VALUES.DISCUSSION.CREATE.BONUSES.DETAILED;
        totalBonus += bonuses.detailed;
      }
    } else {
      // Accepted answer bonus (for comments marked as the accepted answer)
      if (metrics && 'isAcceptedAnswer' in metrics && metrics.isAcceptedAnswer) {
        bonuses.acceptedAnswer = XP_VALUES.DISCUSSION.COMMENT.BONUSES.ACCEPTED_ANSWER;
        totalBonus += bonuses.acceptedAnswer;
      }
    }

    return {
      totalBonus,
      breakdown: bonuses,
    };
  }
}
