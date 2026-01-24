import { GameActionType } from '@codeheroes/types';

export interface ActionTypeDisplay {
  label: string;
  color: string;
  glowClass: string;
  ringClass: string;
  icon: string;
}

export const ACTION_TYPE_DISPLAY: Record<GameActionType, ActionTypeDisplay> = {
  // Code actions
  code_push: {
    label: 'Push',
    color: 'bg-cyan-500',
    glowClass: 'neon-glow-cyan',
    ringClass: 'ring-cyan-500/50',
    icon: 'arrow-up',
  },
  pull_request_create: {
    label: 'PR Created',
    color: 'bg-purple-500',
    glowClass: 'neon-glow-purple',
    ringClass: 'ring-purple-500/50',
    icon: 'git-pull-request',
  },
  pull_request_merge: {
    label: 'PR Merged',
    color: 'bg-green-500',
    glowClass: 'neon-glow-green',
    ringClass: 'ring-green-500/50',
    icon: 'git-merge',
  },
  pull_request_close: {
    label: 'PR Closed',
    color: 'bg-slate-500',
    glowClass: '',
    ringClass: 'ring-slate-500/50',
    icon: 'x-circle',
  },
  code_review_submit: {
    label: 'Review',
    color: 'bg-orange-500',
    glowClass: 'neon-glow-orange',
    ringClass: 'ring-orange-500/50',
    icon: 'eye',
  },
  code_review_comment: {
    label: 'Review Comment',
    color: 'bg-orange-400',
    glowClass: 'neon-glow-orange',
    ringClass: 'ring-orange-400/50',
    icon: 'message-square',
  },

  // Issue actions
  issue_create: {
    label: 'Issue Created',
    color: 'bg-pink-500',
    glowClass: 'neon-glow-pink',
    ringClass: 'ring-pink-500/50',
    icon: 'alert-circle',
  },
  issue_close: {
    label: 'Issue Closed',
    color: 'bg-green-400',
    glowClass: 'neon-glow-green',
    ringClass: 'ring-green-400/50',
    icon: 'check-circle',
  },
  issue_reopen: {
    label: 'Issue Reopened',
    color: 'bg-orange-500',
    glowClass: 'neon-glow-orange',
    ringClass: 'ring-orange-500/50',
    icon: 'refresh-cw',
  },

  // Comment actions
  comment_create: {
    label: 'Comment',
    color: 'bg-cyan-400',
    glowClass: 'neon-glow-cyan',
    ringClass: 'ring-cyan-400/50',
    icon: 'message-circle',
  },
  review_comment_create: {
    label: 'Review Comment',
    color: 'bg-cyan-500',
    glowClass: 'neon-glow-cyan',
    ringClass: 'ring-cyan-500/50',
    icon: 'code',
  },

  // Release actions
  release_publish: {
    label: 'Release',
    color: 'bg-emerald-500',
    glowClass: 'neon-glow-green',
    ringClass: 'ring-emerald-500/50',
    icon: 'package',
  },

  // CI/CD actions
  ci_success: {
    label: 'CI Success',
    color: 'bg-green-500',
    glowClass: 'neon-glow-green',
    ringClass: 'ring-green-500/50',
    icon: 'check',
  },

  // Discussion actions
  discussion_create: {
    label: 'Discussion',
    color: 'bg-purple-400',
    glowClass: 'neon-glow-purple',
    ringClass: 'ring-purple-400/50',
    icon: 'message-square',
  },
  discussion_comment: {
    label: 'Discussion Comment',
    color: 'bg-purple-400',
    glowClass: 'neon-glow-purple',
    ringClass: 'ring-purple-400/50',
    icon: 'message-circle',
  },

  // Workout actions (Strava)
  workout_complete: {
    label: 'Workout',
    color: 'bg-orange-500',
    glowClass: 'neon-glow-orange',
    ringClass: 'ring-orange-500/50',
    icon: 'activity',
  },
  distance_milestone: {
    label: 'Distance Milestone',
    color: 'bg-orange-400',
    glowClass: 'neon-glow-orange',
    ringClass: 'ring-orange-400/50',
    icon: 'map-pin',
  },
  speed_record: {
    label: 'Speed Record',
    color: 'bg-yellow-500',
    glowClass: 'neon-glow-yellow',
    ringClass: 'ring-yellow-500/50',
    icon: 'zap',
  },

  // Manual actions
  manual_update: {
    label: 'Manual',
    color: 'bg-slate-500',
    glowClass: '',
    ringClass: 'ring-slate-500/50',
    icon: 'edit',
  },

  // System actions
  user_registration: {
    label: 'Welcome',
    color: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    glowClass: 'neon-glow-yellow',
    ringClass: 'ring-yellow-400/50',
    icon: 'star',
  },
};

export function getActionTypeDisplay(actionType: GameActionType): ActionTypeDisplay {
  return ACTION_TYPE_DISPLAY[actionType] ?? {
    label: actionType,
    color: 'bg-slate-500',
    glowClass: '',
    ringClass: 'ring-slate-500/50',
    icon: 'circle',
  };
}
