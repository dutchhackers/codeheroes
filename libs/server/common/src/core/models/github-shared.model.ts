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

export interface PullRequestMetrics {
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  timeInvested: number; // in seconds
}

export interface ActivityMetrics {
  [key: string]: number | undefined;
}

export interface PushEventData extends BaseEventData {
  commitCount: number;
  branch: string;
  // Push events don't have an action property
  metrics?: ActivityMetrics;
}

export interface PullRequestEventData extends BaseEventData {
  action: 'opened' | 'closed' | 'reopened' | 'synchronize' | 'edited' | string;
  prNumber: number;
  title: string;
  state: string;
  merged: boolean;
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
  metrics?: ActivityMetrics;
}
