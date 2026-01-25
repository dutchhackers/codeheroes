import { GameActionType } from '@codeheroes/types';

export interface ActionTypeDisplay {
  label: string;
  color: string;
  glowClass: string;
  ringClass: string;
  icon: string;
  borderColor: string;
  cardGlowClass: string;
  textColor: string;
  svgIcon: string;
}

// SVG Icons as inline strings
const SVG_ICONS = {
  codeBrackets: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
  gitMerge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg>`,
  gitBranch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>`,
  alertTriangle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
  checkCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  xCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
  messageCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
  package: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  refreshCw: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  mapPin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
};

export const ACTION_TYPE_DISPLAY: Record<GameActionType, ActionTypeDisplay> = {
  // Code actions
  code_push: {
    label: 'Push',
    color: 'bg-cyan-500',
    glowClass: '',
    ringClass: 'ring-cyan-500/50',
    icon: 'arrow-up',
    borderColor: '#00f5ff',
    cardGlowClass: 'card-glow-cyan',
    textColor: 'text-cyan-400',
    svgIcon: SVG_ICONS.codeBrackets,
  },
  pull_request_create: {
    label: 'PR Created',
    color: 'bg-purple-500',
    glowClass: '',
    ringClass: 'ring-purple-500/50',
    icon: 'git-pull-request',
    borderColor: '#bf00ff',
    cardGlowClass: 'card-glow-purple',
    textColor: 'text-purple-400',
    svgIcon: SVG_ICONS.gitBranch,
  },
  pull_request_merge: {
    label: 'PR Merged',
    color: 'bg-green-500',
    glowClass: '',
    ringClass: 'ring-green-500/50',
    icon: 'git-merge',
    borderColor: '#00ff88',
    cardGlowClass: 'card-glow-green',
    textColor: 'text-green-400',
    svgIcon: SVG_ICONS.gitMerge,
  },
  pull_request_close: {
    label: 'PR Closed',
    color: 'bg-slate-500',
    glowClass: '',
    ringClass: 'ring-slate-500/50',
    icon: 'x-circle',
    borderColor: '#64748b',
    cardGlowClass: '',
    textColor: 'text-slate-400',
    svgIcon: SVG_ICONS.xCircle,
  },
  code_review_submit: {
    label: 'Review',
    color: 'bg-orange-500',
    glowClass: '',
    ringClass: 'ring-orange-500/50',
    icon: 'eye',
    borderColor: '#ff6600',
    cardGlowClass: 'card-glow-orange',
    textColor: 'text-orange-400',
    svgIcon: SVG_ICONS.eye,
  },
  code_review_comment: {
    label: 'Review Comment',
    color: 'bg-orange-400',
    glowClass: '',
    ringClass: 'ring-orange-400/50',
    icon: 'message-square',
    borderColor: '#ff6600',
    cardGlowClass: 'card-glow-orange',
    textColor: 'text-orange-400',
    svgIcon: SVG_ICONS.messageCircle,
  },

  // Issue actions
  issue_create: {
    label: 'Issue Created',
    color: 'bg-pink-500',
    glowClass: '',
    ringClass: 'ring-pink-500/50',
    icon: 'alert-circle',
    borderColor: '#ff00aa',
    cardGlowClass: 'card-glow-pink',
    textColor: 'text-pink-400',
    svgIcon: SVG_ICONS.alertTriangle,
  },
  issue_close: {
    label: 'Issue Closed',
    color: 'bg-green-400',
    glowClass: '',
    ringClass: 'ring-green-400/50',
    icon: 'check-circle',
    borderColor: '#00ff88',
    cardGlowClass: 'card-glow-green',
    textColor: 'text-green-400',
    svgIcon: SVG_ICONS.checkCircle,
  },
  issue_reopen: {
    label: 'Issue Reopened',
    color: 'bg-orange-500',
    glowClass: '',
    ringClass: 'ring-orange-500/50',
    icon: 'refresh-cw',
    borderColor: '#ff6600',
    cardGlowClass: 'card-glow-orange',
    textColor: 'text-orange-400',
    svgIcon: SVG_ICONS.refreshCw,
  },

  // Comment actions
  comment_create: {
    label: 'Comment',
    color: 'bg-cyan-400',
    glowClass: '',
    ringClass: 'ring-cyan-400/50',
    icon: 'message-circle',
    borderColor: '#00f5ff',
    cardGlowClass: 'card-glow-cyan',
    textColor: 'text-cyan-400',
    svgIcon: SVG_ICONS.messageCircle,
  },
  review_comment_create: {
    label: 'Review Comment',
    color: 'bg-cyan-500',
    glowClass: '',
    ringClass: 'ring-cyan-500/50',
    icon: 'code',
    borderColor: '#00f5ff',
    cardGlowClass: 'card-glow-cyan',
    textColor: 'text-cyan-400',
    svgIcon: SVG_ICONS.codeBrackets,
  },

  // Release actions
  release_publish: {
    label: 'Release',
    color: 'bg-emerald-500',
    glowClass: '',
    ringClass: 'ring-emerald-500/50',
    icon: 'package',
    borderColor: '#00ff88',
    cardGlowClass: 'card-glow-green',
    textColor: 'text-green-400',
    svgIcon: SVG_ICONS.package,
  },

  // CI/CD actions
  ci_success: {
    label: 'CI Success',
    color: 'bg-green-500',
    glowClass: '',
    ringClass: 'ring-green-500/50',
    icon: 'check',
    borderColor: '#00ff88',
    cardGlowClass: 'card-glow-green',
    textColor: 'text-green-400',
    svgIcon: SVG_ICONS.check,
  },

  // Discussion actions
  discussion_create: {
    label: 'Discussion',
    color: 'bg-purple-400',
    glowClass: '',
    ringClass: 'ring-purple-400/50',
    icon: 'message-square',
    borderColor: '#bf00ff',
    cardGlowClass: 'card-glow-purple',
    textColor: 'text-purple-400',
    svgIcon: SVG_ICONS.messageCircle,
  },
  discussion_comment: {
    label: 'Discussion Comment',
    color: 'bg-purple-400',
    glowClass: '',
    ringClass: 'ring-purple-400/50',
    icon: 'message-circle',
    borderColor: '#bf00ff',
    cardGlowClass: 'card-glow-purple',
    textColor: 'text-purple-400',
    svgIcon: SVG_ICONS.messageCircle,
  },

  // Workout actions (Strava)
  workout_complete: {
    label: 'Workout',
    color: 'bg-orange-500',
    glowClass: '',
    ringClass: 'ring-orange-500/50',
    icon: 'activity',
    borderColor: '#ff6600',
    cardGlowClass: 'card-glow-orange',
    textColor: 'text-orange-400',
    svgIcon: SVG_ICONS.activity,
  },
  distance_milestone: {
    label: 'Distance Milestone',
    color: 'bg-orange-400',
    glowClass: '',
    ringClass: 'ring-orange-400/50',
    icon: 'map-pin',
    borderColor: '#ff6600',
    cardGlowClass: 'card-glow-orange',
    textColor: 'text-orange-400',
    svgIcon: SVG_ICONS.mapPin,
  },
  speed_record: {
    label: 'Speed Record',
    color: 'bg-yellow-500',
    glowClass: '',
    ringClass: 'ring-yellow-500/50',
    icon: 'zap',
    borderColor: '#ffdd00',
    cardGlowClass: 'card-glow-yellow',
    textColor: 'text-yellow-400',
    svgIcon: SVG_ICONS.zap,
  },

  // Manual actions
  manual_update: {
    label: 'Manual',
    color: 'bg-slate-500',
    glowClass: '',
    ringClass: 'ring-slate-500/50',
    icon: 'edit',
    borderColor: '#64748b',
    cardGlowClass: '',
    textColor: 'text-slate-400',
    svgIcon: SVG_ICONS.edit,
  },

  // System actions
  user_registration: {
    label: 'Welcome',
    color: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    glowClass: '',
    ringClass: 'ring-yellow-400/50',
    icon: 'star',
    borderColor: '#ffdd00',
    cardGlowClass: 'card-glow-yellow',
    textColor: 'text-yellow-400',
    svgIcon: SVG_ICONS.star,
  },
};

export function getActionTypeDisplay(actionType: GameActionType): ActionTypeDisplay {
  return ACTION_TYPE_DISPLAY[actionType] ?? {
    label: actionType,
    color: 'bg-slate-500',
    glowClass: '',
    ringClass: 'ring-slate-500/50',
    icon: 'circle',
    borderColor: '#64748b',
    cardGlowClass: '',
    textColor: 'text-slate-400',
    svgIcon: SVG_ICONS.codeBrackets,
  };
}
