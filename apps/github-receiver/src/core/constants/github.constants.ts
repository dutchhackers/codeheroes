export const GitHubEventConfig = {
  'pull_request': ['opened', 'closed', 'synchronize', 'merged', 'reviewed', 'updated'],
  'issues': ['opened', 'closed', 'edited', 'reopened'],
  'push': [undefined], // push events don't have actions
  'pull_request_review': ['submitted', 'edited', 'dismissed']
} as const;

export type SupportedEventType = keyof typeof GitHubEventConfig;
export type SupportedEventAction<T extends SupportedEventType> = typeof GitHubEventConfig[T][number];

export const SupportedGitHubEventActions: string[] = Object.entries(GitHubEventConfig)
  .flatMap(([eventType, actions]) => 
    actions.map(action => 
      action ? `github.${eventType}.${action}` : `github.${eventType}`
    )
  );
