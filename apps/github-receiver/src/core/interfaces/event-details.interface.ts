// Base details interface
export interface BaseEventDetails extends Record<string, unknown> {
  authorId: string | null;
  authorExternalId?: string;
  repositoryId: string;
  repositoryName: string;
  repositoryOwner: string;
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