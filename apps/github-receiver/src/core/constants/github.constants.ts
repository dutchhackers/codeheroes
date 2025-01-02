export const GitHubEventType = {
  PUSH: 'push',
  PULL_REQUEST: 'pull_request',
  ISSUES: 'issues'
} as const;

export type GitHubEventType = typeof GitHubEventType[keyof typeof GitHubEventType];
