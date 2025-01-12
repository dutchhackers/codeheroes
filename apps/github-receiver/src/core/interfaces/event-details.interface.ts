export interface Actor {
  id: string;
  username?: string;
}

export interface Repository {
  id: string;
  name: string;
  owner: string;
}

// Base details interface
export interface BaseEventDetails extends Record<string, unknown> {
  actor: Actor;
  repository: Repository;
  lastCommitMessage?: string;
}

// Activity-specific details interfaces
export interface PushEventDetails extends BaseEventDetails {
  commitCount: number;
  branch: string;
}

export interface PullRequestEventDetails extends BaseEventDetails {
  prNumber: number;
  title: string;
  state: string;
}

export interface IssueEventDetails extends BaseEventDetails {
  issueNumber: number;
  title: string;
  state: string;
  action: string;
}