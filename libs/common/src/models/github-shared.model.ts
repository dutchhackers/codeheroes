export interface Repository {
  id: string;
  name: string;
  owner: string;
}

// Event details interfaces
export interface Sender {
  id: string;
  login: string;
}

export interface BaseEventDetails extends Record<string, unknown> {
  repository: Repository;
  lastCommitMessage?: string;
  sender: Sender;
}

export interface PushEventDetails extends BaseEventDetails {
  commitCount: number;
  branch: string;
  // Push events don't have an action property
}

export interface PullRequestEventDetails extends BaseEventDetails {
  action: 'opened' | 'closed' | 'reopened' | 'synchronize' | 'edited' | string;
  prNumber: number;
  title: string;
  state: string;
}

export interface IssueEventDetails extends BaseEventDetails {
  action: 'opened' | 'closed' | 'reopened' | 'edited' | string;
  issueNumber: number;
  title: string;
  state: string;
}
