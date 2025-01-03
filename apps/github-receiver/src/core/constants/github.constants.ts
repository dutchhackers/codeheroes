export const GitHubEventType = {
  PUSH: 'push',
  PULL_REQUEST: 'pull_request',
  ISSUES: 'issues',
} as const;

export type GitHubEventType =
  (typeof GitHubEventType)[keyof typeof GitHubEventType];

export const SupportedGitHubEventActions: string[] = [
  'github.pull_request.opened',
  'github.pull_request.closed',
  'github.pull_request.merged',
  'github.pull_request.reviewed',
  'github.pull_request.updated',
  'github.issue.opened',
  'github.issue.closed',
  'github.issue.updated',
  'github.push',
  'github.workflow_run.completed',
];
