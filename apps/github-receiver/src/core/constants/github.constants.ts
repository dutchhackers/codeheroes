export const GitHubEventConfig = {
  'pull_request': ['opened', 'closed', 'merged', 'reviewed', 'updated'],
  'issue': ['opened', 'closed', 'updated'],
  'push': [undefined], // push events don't have actions
} as const;

export type SupportedEventType = keyof typeof GitHubEventConfig;
export type SupportedEventAction<T extends SupportedEventType> = typeof GitHubEventConfig[T][number];

export const SupportedGitHubEventActions: string[] = Object.entries(GitHubEventConfig)
  .flatMap(([eventType, actions]) => 
    actions.map(action => 
      action ? `github.${eventType}.${action}` : `github.${eventType}`
    )
  );
