import { GameActionType } from '@codeheroes/types';

/**
 * Action types that can be stacked into a PR lifecycle view.
 * These represent events that are part of a pull request's journey.
 */
export const PR_STACKABLE_ACTION_TYPES: GameActionType[] = [
  'pull_request_create',
  'pull_request_merge',
  'pull_request_close',
  'code_review_submit',
  'code_review_comment',
  'comment_create', // Only when target.type === 'pull_request'
  'review_comment_create',
];

/**
 * Action types that represent the final state of a PR
 */
export const PR_FINAL_STATE_TYPES: GameActionType[] = [
  'pull_request_merge',
  'pull_request_close',
];

/**
 * Determines the final state color for a PR stack based on the latest final action
 */
export type PRFinalState = 'merged' | 'closed' | 'open';
