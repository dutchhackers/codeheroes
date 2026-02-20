import { Activity, GameActionType, isGameActionActivity, isBadgeEarnedActivity, isLevelUpActivity } from '@codeheroes/types';

/**
 * Builds a human-readable sentence for an activity.
 * Shared between activity-item component and HQ highlights.
 */
export function buildActivityDescription(activity: Activity): string {
  // Handle badge-earned activities
  if (isBadgeEarnedActivity(activity)) {
    return `earned ${activity.badge.icon} ${activity.badge.name}!`;
  }

  // Handle level-up activities
  if (isLevelUpActivity(activity)) {
    if (activity.level.new - activity.level.previous > 1) {
      return `leveled up to ${activity.level.new}!`;
    }
    return `reached level ${activity.level.new}!`;
  }

  // Handle game action activities
  if (isGameActionActivity(activity)) {
    return buildGameActionSentence(activity.sourceActionType, activity);
  }

  // Fallback
  return (activity as any).userFacingDescription || 'performed an action';
}

function buildGameActionSentence(actionType: GameActionType, activity: Activity): string {
  if (!isGameActionActivity(activity)) {
    return activity.userFacingDescription;
  }

  const desc = activity.userFacingDescription;

  // Extract useful info from description
  const prMatch = desc.match(/#(\d+)/);
  const prNumber = prMatch ? prMatch[1] : '';

  // Extract quoted title if present
  const titleMatch = desc.match(/"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : '';

  // Extract repo name
  const repoMatch = desc.match(/in (\S+)$/);
  const repo = repoMatch ? repoMatch[1] : '';

  switch (actionType) {
    case 'code_push': {
      const branchMatch = desc.match(/to (\S+)\s+in/);
      const branch = branchMatch ? branchMatch[1] : 'main';
      return `pushed to \`${branch}\`${repo ? ` in \`${repo}\`` : ''}`;
    }

    case 'pull_request_create':
      return `opened PR #${prNumber}${title ? `: \`${title}\`` : ''}${repo ? ` in \`${repo}\`` : ''}`;

    case 'pull_request_merge':
      return `merged PR #${prNumber}${title ? `: \`${title}\`` : ''}${repo ? ` into \`${repo}\`` : ''}`;

    case 'pull_request_close':
      return `closed PR #${prNumber}${title ? `: \`${title}\`` : ''}`;

    case 'code_review_submit':
      return `reviewed PR #${prNumber}${repo ? ` in \`${repo}\`` : ''}`;

    case 'code_review_comment':
      return `commented on PR #${prNumber}${repo ? ` in \`${repo}\`` : ''}`;

    case 'review_comment_create':
      return `added review comment${prNumber ? ` on #${prNumber}` : ''}${repo ? ` in \`${repo}\`` : ''}`;

    case 'issue_create':
      return `opened Issue #${prNumber}${title ? `: \`${title}\`` : ''}${repo ? ` in \`${repo}\`` : ''}`;

    case 'issue_close':
      return `closed Issue #${prNumber}${title ? `: \`${title}\`` : ''}`;

    case 'issue_reopen':
      return `reopened Issue #${prNumber}`;

    case 'comment_create':
      return `commented${prNumber ? ` on #${prNumber}` : ''}${repo ? ` in \`${repo}\`` : ''}`;

    case 'release_publish': {
      const versionMatch = desc.match(/v?(\d+\.\d+\.\d+)/);
      const version = versionMatch ? versionMatch[1] : '';
      return `published release${version ? ` v${version}` : ''}${repo ? ` in \`${repo}\`` : ''}`;
    }

    case 'user_registration':
      return `joined Code Heroes!`;

    case 'ci_success': {
      const context = activity.context;
      const branch = 'workflow' in context && context.workflow?.headBranch ? context.workflow.headBranch : '';
      return `CI passed${branch ? ` on \`${branch}\`` : ''}`;
    }

    case 'discussion_create':
      return `started a discussion${repo ? ` in \`${repo}\`` : ''}`;

    case 'discussion_comment':
      return `commented on a discussion${repo ? ` in \`${repo}\`` : ''}`;

    case 'workout_complete':
      return `completed a workout`;

    case 'manual_update':
      return desc;

    default:
      // Fallback: clean up the original description
      return desc.replace(/^(Created|Merged|Approved|Closed|Pushed|Commented)\s+/i, '');
  }
}
