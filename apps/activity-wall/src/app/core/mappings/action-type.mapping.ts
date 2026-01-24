import { GameActionType } from '@codeheroes/types';

export interface ActionTypeDisplay {
  label: string;
  color: string;
  icon: string;
}

export const ACTION_TYPE_DISPLAY: Record<GameActionType, ActionTypeDisplay> = {
  // Code actions
  code_push: {
    label: 'Push',
    color: 'bg-blue-500',
    icon: 'arrow-up',
  },
  pull_request_create: {
    label: 'PR Created',
    color: 'bg-purple-500',
    icon: 'git-pull-request',
  },
  pull_request_merge: {
    label: 'PR Merged',
    color: 'bg-green-500',
    icon: 'git-merge',
  },
  pull_request_close: {
    label: 'PR Closed',
    color: 'bg-gray-500',
    icon: 'x-circle',
  },
  code_review_submit: {
    label: 'Review',
    color: 'bg-yellow-500',
    icon: 'eye',
  },
  code_review_comment: {
    label: 'Review Comment',
    color: 'bg-yellow-400',
    icon: 'message-square',
  },

  // Issue actions
  issue_create: {
    label: 'Issue Created',
    color: 'bg-red-500',
    icon: 'alert-circle',
  },
  issue_close: {
    label: 'Issue Closed',
    color: 'bg-green-400',
    icon: 'check-circle',
  },
  issue_reopen: {
    label: 'Issue Reopened',
    color: 'bg-orange-500',
    icon: 'refresh-cw',
  },

  // Comment actions
  comment_create: {
    label: 'Comment',
    color: 'bg-cyan-500',
    icon: 'message-circle',
  },
  review_comment_create: {
    label: 'Review Comment',
    color: 'bg-cyan-400',
    icon: 'code',
  },

  // Release actions
  release_publish: {
    label: 'Release',
    color: 'bg-emerald-500',
    icon: 'package',
  },

  // CI/CD actions
  ci_success: {
    label: 'CI Success',
    color: 'bg-green-600',
    icon: 'check',
  },

  // Discussion actions
  discussion_create: {
    label: 'Discussion',
    color: 'bg-indigo-500',
    icon: 'message-square',
  },
  discussion_comment: {
    label: 'Discussion Comment',
    color: 'bg-indigo-400',
    icon: 'message-circle',
  },

  // Workout actions (Strava)
  workout_complete: {
    label: 'Workout',
    color: 'bg-orange-500',
    icon: 'activity',
  },
  distance_milestone: {
    label: 'Distance Milestone',
    color: 'bg-orange-400',
    icon: 'map-pin',
  },
  speed_record: {
    label: 'Speed Record',
    color: 'bg-orange-600',
    icon: 'zap',
  },

  // Manual actions
  manual_update: {
    label: 'Manual',
    color: 'bg-gray-400',
    icon: 'edit',
  },
};

export function getActionTypeDisplay(actionType: GameActionType): ActionTypeDisplay {
  return ACTION_TYPE_DISPLAY[actionType] ?? {
    label: actionType,
    color: 'bg-gray-500',
    icon: 'circle',
  };
}
