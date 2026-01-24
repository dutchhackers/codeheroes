export const GitHubEventConfig = {
  pull_request: [
    'opened',
    'closed',
    'synchronize',
    'merged',
    'reviewed',
    'updated',
    'converted_to_draft',
    'ready_for_review',
  ],
  issues: ['opened', 'closed', 'edited', 'reopened'],
  issue_comment: ['created', 'edited', 'deleted'],
  push: [], // push events don't need actions
  pull_request_review: ['submitted', 'edited', 'dismissed'],
  pull_request_review_thread: ['resolved', 'unresolved'],
  pull_request_review_comment: ['created', 'edited', 'deleted'],
  release: ['published', 'created', 'released', 'prereleased'],
  workflow_run: ['completed', 'requested', 'in_progress'],
  discussion: ['created', 'edited', 'deleted', 'pinned', 'unpinned', 'closed', 'reopened', 'answered', 'unanswered'],
  discussion_comment: ['created', 'edited', 'deleted'],
  delete: [], // delete events don't need actions
  create: [], // create events don't need actions
} as const;

export type SupportedEventType =
  | 'push'
  | 'pull_request'
  | 'pull_request_review'
  | 'issues'
  | 'issue_comment'
  | 'pull_request_review_comment'
  | 'pull_request_review_thread'
  | 'release'
  | 'workflow_run'
  | 'discussion'
  | 'discussion_comment'
  | 'delete'
  | 'create';

export type SupportedEventAction<T extends SupportedEventType> = (typeof GitHubEventConfig)[T][number];

export const SupportedGitHubEventActions: string[] = Object.entries(GitHubEventConfig).flatMap(([eventType, actions]) =>
  (actions as readonly string[]).map((action: string) => (action ? `github.${eventType}.${action}` : `github.${eventType}`)),
);
