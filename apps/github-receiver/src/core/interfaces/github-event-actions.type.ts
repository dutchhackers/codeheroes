// Pull Request related actions
type PullRequestActions =
  | 'github.pull_request.opened'
  | 'github.pull_request.closed'
  | 'github.pull_request.merged'
  | 'github.pull_request.reviewed'
  | 'github.pull_request.updated';

// Issue related actions
type IssueActions =
  | 'github.issue.opened'
  | 'github.issue.closed'
  | 'github.issue.updated';

// Push related actions
type PushActions = 'github.push';

// Workflow related actions
type WorkflowActions = 'github.workflow_run.completed';

// Combined type of all possible GitHub event actions
export type GitHubEventAction =
  | PullRequestActions
  | IssueActions
  | PushActions
  | WorkflowActions;
