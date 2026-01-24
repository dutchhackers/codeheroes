import { GameActionType } from '@codeheroes/types';

export interface ActionTypeDisplay {
  label: string;
  color: string;
  glowClass: string;
  icon: string;
}

export const ACTION_TYPE_DISPLAY: Record<GameActionType, ActionTypeDisplay> = {
  // Code actions
  code_push: {
    label: 'Push',
    color: 'bg-cyan-500',
    glowClass: 'neon-glow-cyan',
    icon: 'arrow-up',
  },
  pull_request_create: {
    label: 'PR Created',
    color: 'bg-purple-500',
    glowClass: 'neon-glow-purple',
    icon: 'git-pull-request',
  },
  pull_request_merge: {
    label: 'PR Merged',
    color: 'bg-green-500',
    glowClass: 'neon-glow-green',
    icon: 'git-merge',
  },
  pull_request_close: {
    label: 'PR Closed',
    color: 'bg-slate-500',
    glowClass: '',
    icon: 'x-circle',
  },
  code_review_submit: {
    label: 'Review',
    color: 'bg-orange-500',
    glowClass: 'neon-glow-orange',
    icon: 'eye',
  },
  code_review_comment: {
    label: 'Review Comment',
    color: 'bg-orange-400',
    glowClass: 'neon-glow-orange',
    icon: 'message-square',
  },

  // Issue actions
  issue_create: {
    label: 'Issue Created',
    color: 'bg-pink-500',
    glowClass: 'neon-glow-pink',
    icon: 'alert-circle',
  },
  issue_close: {
    label: 'Issue Closed',
    color: 'bg-green-400',
    glowClass: 'neon-glow-green',
    icon: 'check-circle',
  },
  issue_reopen: {
    label: 'Issue Reopened',
    color: 'bg-orange-500',
    glowClass: 'neon-glow-orange',
    icon: 'refresh-cw',
  },

  // Comment actions
  comment_create: {
    label: 'Comment',
    color: 'bg-cyan-400',
    glowClass: 'neon-glow-cyan',
    icon: 'message-circle',
  },
  review_comment_create: {
    label: 'Review Comment',
    color: 'bg-cyan-500',
    glowClass: 'neon-glow-cyan',
    icon: 'code',
  },

  // Release actions
  release_publish: {
    label: 'Release',
    color: 'bg-emerald-500',
    glowClass: 'neon-glow-green',
    icon: 'package',
  },

  // CI/CD actions
  ci_success: {
    label: 'CI Success',
    color: 'bg-green-500',
    glowClass: 'neon-glow-green',
    icon: 'check',
  },

  // Discussion actions
  discussion_create: {
    label: 'Discussion',
    color: 'bg-purple-400',
    glowClass: 'neon-glow-purple',
    icon: 'message-square',
  },
  discussion_comment: {
    label: 'Discussion Comment',
    color: 'bg-purple-400',
    glowClass: 'neon-glow-purple',
    icon: 'message-circle',
  },

  // Workout actions (Strava)
  workout_complete: {
    label: 'Workout',
    color: 'bg-orange-500',
    glowClass: 'neon-glow-orange',
    icon: 'activity',
  },
  distance_milestone: {
    label: 'Distance Milestone',
    color: 'bg-orange-400',
    glowClass: 'neon-glow-orange',
    icon: 'map-pin',
  },
  speed_record: {
    label: 'Speed Record',
    color: 'bg-yellow-500',
    glowClass: 'neon-glow-yellow',
    icon: 'zap',
  },

  // Manual actions
  manual_update: {
    label: 'Manual',
    color: 'bg-slate-500',
    glowClass: '',
    icon: 'edit',
  },

  // System actions
  user_registration: {
    label: 'Welcome',
    color: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    glowClass: 'neon-glow-yellow',
    icon: 'star',
  },
};

export function getActionTypeDisplay(actionType: GameActionType): ActionTypeDisplay {
  return ACTION_TYPE_DISPLAY[actionType] ?? {
    label: actionType,
    color: 'bg-slate-500',
    glowClass: '',
    icon: 'circle',
  };
}
