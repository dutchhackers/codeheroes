// Pull Request related actions
type PullRequestActions =
  | 'github-pull-request-opened'
  | 'github-pull-request-closed'
  | 'github-pull-request-merged'
  | 'github-pull-request-reviewed';

// Issue related actions
type IssueActions =
  | 'github-issue-opened'
  | 'github-issue-closed'
  | 'github-issue-updated';

// Push related actions
type PushActions = 'github-push-completed';

// Workflow related actions
type WorkflowActions = 'github-workflow-run-completed';

// Combined type of all possible GitHub event actions
export type GitHubEventAction =
  | PullRequestActions
  | IssueActions
  | PushActions
  | WorkflowActions;