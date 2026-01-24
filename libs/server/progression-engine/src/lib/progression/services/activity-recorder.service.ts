import { getCurrentTimeAsISO } from '@codeheroes/common';
import { Activity, GameAction, GameActionType, CodePushMetrics } from '@codeheroes/types';
import { ProgressionUpdate } from '../core/progression-state.model';
import { XpCalculationResult } from '../core/xp-calculation.model';

/**
 * Service responsible for creating activity records from game actions
 */
export class ActivityRecorderService {
  /**
   * Create an activity record from a game action
   * @param action The game action to create activity from
   * @param xpResult XP calculation result
   * @returns Activity record
   */
  createFromAction(action: GameAction, xpResult: XpCalculationResult): Activity {
    const now = getCurrentTimeAsISO();

    // Generate a unique ID
    const activityId = `act_${Date.now()}_${action.id}`;

    // Create the activity
    const activity: Activity = {
      id: activityId,
      userId: action.userId,
      type: 'game-action',
      sourceActionType: action.type,

      // Store context and metrics from the game action
      context: action.context,
      metrics: action.metrics,

      // Store XP information
      xp: {
        earned: xpResult.total,
        breakdown: xpResult.breakdown.map((item) => ({
          type: item.type,
          amount: item.amount,
          description: item.description,
        })),
      },

      // Add a user-facing description
      userFacingDescription: this.generateUserFacingDescription(action),

      // Store timestamps
      createdAt: now,
      updatedAt: now,

      // Include original event info
      eventId: action.externalId,
      provider: action.provider,

      // Add processing result
      processingResult: {
        processed: true,
        processedAt: now,
        xp: {
          awarded: xpResult.total,
          breakdown: xpResult.breakdown.map((item) => ({
            xp: item.amount,
            description: item.description,
          })),
          processed: true,
        },
      },
    };

    return activity;
  }

  /**
   * Create an activity record for a manual progression update
   * @param userId User ID
   * @param update Progression update data
   * @returns Activity record
   */
  createManualActivity(userId: string, update: ProgressionUpdate): Activity {
    const now = getCurrentTimeAsISO();

    // Generate a unique ID
    const activityId = `manual_${Date.now()}_${userId}`;

    // Create the manual activity
    const activity: Activity = {
      id: activityId,
      userId,
      type: 'game-action',
      sourceActionType: (update.activityType || 'manual_update') as GameActionType,

      // Create minimal context
      context: {
        type: 'manual',
        provider: 'system',
      },

      // No metrics for manual activities
      metrics: {
        type: 'manual',
        timestamp: now,
      },

      // Store XP information
      xp: {
        earned: update.xpGained,
        breakdown: [
          {
            type: 'manual',
            amount: update.xpGained,
            description: `Manual update: ${update.activityType || 'XP adjustment'}`,
          },
        ],
      },

      // Add a user-facing description
      userFacingDescription: this.generateManualActivityDescription(update),

      // Store timestamps
      createdAt: now,
      updatedAt: now,

      // Include event info
      eventId: activityId,
      provider: 'system',

      // Add processing result
      processingResult: {
        processed: true,
        processedAt: now,
        xp: {
          awarded: update.xpGained,
          breakdown: [
            {
              xp: update.xpGained,
              description: `Manual update: ${update.activityType || 'XP adjustment'}`,
            },
          ],
          processed: true,
        },
      },
    };

    return activity;
  }

  /**
   * Generate a user-friendly description for an activity
   * @param action Game action to describe
   * @returns User-facing description
   */
  private generateUserFacingDescription(action: GameAction): string {
    switch (action.type) {
      case 'code_push':
        return this.describeCodePush(action);
      case 'pull_request_create':
        return this.describePullRequestCreate(action);
      case 'pull_request_merge':
        return this.describePullRequestMerge(action);
      case 'pull_request_close':
        return this.describePullRequestClose(action);
      case 'code_review_submit':
        return this.describeCodeReview(action);
      case 'issue_create':
        return this.describeIssueCreate(action);
      case 'issue_close':
        return this.describeIssueClose(action);
      case 'issue_reopen':
        return this.describeIssueReopen(action);
      default:
        return `${this.formatActionType(action.type)} activity`;
    }
  }

  /**
   * Create description for code push activity
   */
  private describeCodePush(action: GameAction): string {
    const metrics = action.metrics;
    const commitCount = metrics && metrics.type === 'code_push' ? (metrics as CodePushMetrics).commitCount : 1;

    const branchName = action.context.type === 'code_push' ? action.context.branch : 'unknown';
    const repoName = 'repository' in action.context ? action.context.repository.name : 'unknown';

    return commitCount === 1
      ? `Pushed a commit to ${branchName} in ${repoName}`
      : `Pushed ${commitCount} commits to ${branchName} in ${repoName}`;
  }

  /**
   * Create description for pull request creation
   */
  private describePullRequestCreate(action: GameAction): string {
    if (action.context.type !== 'pull_request') {
      return 'Created a pull request';
    }

    const prTitle = action.context.pullRequest.title;
    const prNumber = action.context.pullRequest.number;
    const repoName = action.context.repository.name;

    return `Created pull request #${prNumber}: "${prTitle}" in ${repoName}`;
  }

  /**
   * Create description for pull request merge
   */
  private describePullRequestMerge(action: GameAction): string {
    if (action.context.type !== 'pull_request') {
      return 'Merged a pull request';
    }

    const prTitle = action.context.pullRequest.title;
    const prNumber = action.context.pullRequest.number;
    const repoName = action.context.repository.name;

    return `Merged pull request #${prNumber}: "${prTitle}" in ${repoName}`;
  }

  /**
   * Create description for pull request closure
   */
  private describePullRequestClose(action: GameAction): string {
    if (action.context.type !== 'pull_request') {
      return 'Closed a pull request';
    }

    const prTitle = action.context.pullRequest.title;
    const prNumber = action.context.pullRequest.number;
    const repoName = action.context.repository.name;

    return `Closed pull request #${prNumber}: "${prTitle}" in ${repoName}`;
  }

  /**
   * Create description for code review submission
   */
  private describeCodeReview(action: GameAction): string {
    if (action.context.type !== 'code_review') {
      return 'Submitted a code review';
    }

    const prNumber = action.context.pullRequest.number;
    const repoName = action.context.repository.name;
    const state = action.context.review.state;

    if (state === 'approved') {
      return `Approved pull request #${prNumber} in ${repoName}`;
    } else if (state === 'changes_requested') {
      return `Requested changes on pull request #${prNumber} in ${repoName}`;
    } else {
      return `Commented on pull request #${prNumber} in ${repoName}`;
    }
  }

  /**
   * Format action type for display
   */
  private formatActionType(actionType: string): string {
    return actionType
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Create description for issue creation
   */
  private describeIssueCreate(action: GameAction): string {
    if (action.context.type !== 'issue') {
      return 'Created an issue';
    }

    const issueTitle = action.context.issue.title;
    const issueNumber = action.context.issue.number;
    const repoName = action.context.repository.name;

    return `Created issue #${issueNumber}: "${issueTitle}" in ${repoName}`;
  }

  /**
   * Create description for issue closure
   */
  private describeIssueClose(action: GameAction): string {
    if (action.context.type !== 'issue') {
      return 'Closed an issue';
    }

    const issueTitle = action.context.issue.title;
    const issueNumber = action.context.issue.number;
    const repoName = action.context.repository.name;

    return `Closed issue #${issueNumber}: "${issueTitle}" in ${repoName}`;
  }

  /**
   * Create description for issue reopening
   */
  private describeIssueReopen(action: GameAction): string {
    if (action.context.type !== 'issue') {
      return 'Reopened an issue';
    }

    const issueTitle = action.context.issue.title;
    const issueNumber = action.context.issue.number;
    const repoName = action.context.repository.name;

    return `Reopened issue #${issueNumber}: "${issueTitle}" in ${repoName}`;
  }

  /**
   * Generate description for manual activities
   */
  private generateManualActivityDescription(update: ProgressionUpdate): string {
    switch (update.activityType) {
      case 'user_registration':
        return 'Welcome to Code Heroes!';
      case 'profile_completion':
        return 'Completed profile setup';
      case 'daily_login':
        return 'Daily login bonus';
      default:
        return `Manual ${update.activityType || 'XP'} update: +${update.xpGained}XP`;
    }
  }
}
