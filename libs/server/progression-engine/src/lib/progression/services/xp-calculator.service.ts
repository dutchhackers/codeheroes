import { logger } from '@codeheroes/common';
import { GameAction, GameActionType } from '@codeheroes/types';
import { XP_VALUES } from '../../config/xp-values.config';
import { XpCalculationResult, XpBreakdownItem } from '../core/xp-calculation.model';
import { ActionHandlerFactory } from '../handlers/action-handler.factory';

/**
 * Service responsible for calculating XP based on game actions
 */
export class XpCalculatorService {
  /**
   * Calculate XP for a given game action
   * @param action The game action to calculate XP for
   * @returns XP calculation result with breakdown
   */
  async calculateForAction(action: GameAction): Promise<XpCalculationResult> {
    logger.debug(`Calculating XP for action: ${action.type}`);

    try {
      // Get appropriate handler for this action type
      const handler = ActionHandlerFactory.getHandler(action.type);

      // Calculate base XP for this action type
      const baseXp = this.getBaseXpForActionType(action.type);

      // Calculate bonuses using the specific handler
      const bonuses = handler.calculateBonuses(action.context, action.metrics);

      // Calculate total XP
      const totalXp = baseXp + bonuses.totalBonus;

      // Create XP breakdown
      const breakdown: XpBreakdownItem[] = [
        {
          type: 'base',
          amount: baseXp,
          description: `Base XP for ${this.formatActionType(action.type)}`,
        },
      ];

      // Add bonus breakdowns
      for (const [bonusType, amount] of Object.entries(bonuses.breakdown)) {
        if (amount > 0) {
          breakdown.push({
            type: bonusType,
            amount,
            description: this.getBonusDescription(bonusType, action.type),
          });
        }
      }

      // Create final result
      const result: XpCalculationResult = {
        baseXp,
        bonusXp: bonuses.totalBonus,
        total: totalXp,
        breakdown,
      };

      logger.debug('XP calculation complete', {
        actionType: action.type,
        total: result.total,
        breakdown: result.breakdown.map((b) => `${b.type}: ${b.amount}`),
      });

      return result;
    } catch (error) {
      logger.error('Error calculating XP', {
        actionType: action.type,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Calculate XP for a manual update (not from a game action)
   * @param activityType Type of activity
   * @param amount Optional custom XP amount
   * @returns XP calculation result
   */
  calculateForManualUpdate(activityType: string, amount?: number): XpCalculationResult {
    // For manual updates, we use either the specified amount or a default
    const xpAmount = amount || this.getDefaultManualXp(activityType);

    return {
      baseXp: xpAmount,
      bonusXp: 0,
      total: xpAmount,
      breakdown: [
        {
          type: 'manual',
          amount: xpAmount,
          description: `Manual ${activityType} update`,
        },
      ],
    };
  }

  /**
   * Get base XP value for a given action type
   * @param actionType Game action type
   * @returns Base XP value
   */
  private getBaseXpForActionType(actionType: GameActionType): number {
    switch (actionType) {
      case 'code_push':
        return XP_VALUES.CODE_PUSH.BASE;
      case 'pull_request_create':
        return XP_VALUES.PULL_REQUEST.CREATE.BASE;
      case 'pull_request_merge':
        return XP_VALUES.PULL_REQUEST.MERGE.BASE;
      case 'pull_request_close':
        return XP_VALUES.PULL_REQUEST.CLOSE.BASE;
      case 'code_review_submit':
        return XP_VALUES.CODE_REVIEW.BASE;
      case 'issue_create':
        return XP_VALUES.ISSUE.CREATE.BASE;
      case 'issue_close':
        return XP_VALUES.ISSUE.CLOSE.BASE;
      case 'issue_reopen':
        return XP_VALUES.ISSUE.REOPEN.BASE;
      case 'comment_create':
        return XP_VALUES.COMMENT.BASE;
      case 'review_comment_create':
        return XP_VALUES.REVIEW_COMMENT.BASE;
      case 'release_publish':
        return XP_VALUES.RELEASE.BASE;
      case 'ci_success':
        return XP_VALUES.WORKFLOW.SUCCESS.BASE;
      case 'discussion_create':
        return XP_VALUES.DISCUSSION.CREATE.BASE;
      case 'discussion_comment':
        return XP_VALUES.DISCUSSION.COMMENT.BASE;
      default:
        // Default value for other action types
        return 50;
    }
  }

  /**
   * Get default XP value for manual updates
   * @param activityType Activity type string
   * @returns Default XP amount
   */
  private getDefaultManualXp(activityType: string): number {
    // Map activity types to default XP values
    const defaultValues: Record<string, number> = {
      user_registration: 100,
      profile_completion: 150,
      admin_award: 200,
      challenge_completion: 250,
      daily_login: 25,
    };

    return defaultValues[activityType] || 50;
  }

  /**
   * Format action type for user-friendly display
   * @param actionType Game action type
   * @returns Formatted action type string
   */
  private formatActionType(actionType: GameActionType): string {
    return actionType
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get user-friendly description for bonus types
   * @param bonusType Type of bonus
   * @param actionType Related game action type
   * @returns User-friendly description
   */
  private getBonusDescription(bonusType: string, actionType: GameActionType): string {
    const bonusDescriptions: Record<string, string> = {
      multipleCommits: 'Bonus for multiple commits',
      multipleFiles: 'Bonus for changes across multiple files',
      significantChanges: 'Bonus for significant code changes',
      detailedReview: 'Bonus for detailed review comments',
      thoroughReview: 'Bonus for thorough review with suggestions',
      streak: 'Bonus for activity streak',
      firstDaily: 'First activity of the day',
      // Comment bonuses
      detailedComment: 'Bonus for detailed comment',
      // Review comment bonuses
      withSuggestion: 'Bonus for code suggestion',
      detailed: 'Bonus for detailed content',
      // Release bonuses
      majorVersion: 'Bonus for major version release',
      minorVersion: 'Bonus for minor version release',
      withNotes: 'Bonus for release notes',
      // Workflow bonuses
      deployment: 'Bonus for deployment workflow',
      // Discussion bonuses
      acceptedAnswer: 'Bonus for accepted answer',
    };

    return bonusDescriptions[bonusType] || `${bonusType} bonus`;
  }
}
