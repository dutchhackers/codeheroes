export interface Repository {
  id: string;
  name: string;
  owner: string;
  ownerType: 'User' | 'Organization'; // Added this line
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

export interface PullRequestMetrics {
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
}

export interface EventMetrics {
  [key: string]: number | undefined;
}

export interface PushEventData extends BaseEventData {
  branch: string;
  metrics?: EventMetrics;
}

export interface PullRequestEventData extends BaseEventData {
  action: 'opened' | 'closed' | 'reopened' | 'synchronize' | 'edited' | string;
  prNumber: number;
  title: string;
  state: string;
  draft: boolean;
  merged: boolean;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  mergedBy?: Sender;
  metrics?: PullRequestMetrics;
}

export type IssueStateReason = 'completed' | 'not_planned' | 'reopened' | null;

export interface IssueEventData extends BaseEventData {
  action: 'opened' | 'closed' | 'reopened' | 'edited' | string;
  issueNumber: number;
  title: string;
  state: string;
  stateReason?: IssueStateReason;
  metrics?: EventMetrics;
}
