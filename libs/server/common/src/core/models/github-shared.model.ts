export interface Repository {
  id: string;
  name: string;
  owner: string;
  ownerType: 'User' | 'Organization';  // Added this line
}

// Event details interfaces
export interface Sender {
  id: string;
  login: string;
}

export interface BaseEventData extends Record<string, unknown> {
  repository: Repository;
  lastCommitMessage?: string;
  sender: Sender;
}

export interface PushEventData extends BaseEventData {
  commitCount: number;
  branch: string;
  // Push events don't have an action property
}

export interface PullRequestEventData extends BaseEventData {
  action: 'opened' | 'closed' | 'reopened' | 'synchronize' | 'edited' | string;
  prNumber: number;
  title: string;
  state: string;
  merged: boolean;
  mergedAt?: string;
  mergedBy?: Sender;
}

export interface IssueEventData extends BaseEventData {
  action: 'opened' | 'closed' | 'reopened' | 'edited' | string;
  issueNumber: number;
  title: string;
  state: string;
}
