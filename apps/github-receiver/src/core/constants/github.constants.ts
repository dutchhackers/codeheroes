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
  push: [], // push events don't need actions
  pull_request_review: ['submitted', 'edited', 'dismissed'],
  pull_request_review_thread: ['resolved', 'unresolved'],
  pull_request_review_comment: ['created', 'edited', 'deleted'],
  delete: [], // delete events don't need actions
} as const;

export type SupportedEventType = 
  | 'push'
  | 'pull_request'
  | 'pull_request_review'
  | 'issues'
  | 'pull_request_review_comment'
  | 'pull_request_review_thread'
  | 'delete';

export type SupportedEventAction<T extends SupportedEventType> = (typeof GitHubEventConfig)[T][number];

export const SupportedGitHubEventActions: string[] = Object.entries(GitHubEventConfig).flatMap(([eventType, actions]) =>
  actions.map((action) => (action ? `github.${eventType}.${action}` : `github.${eventType}`)),
);
