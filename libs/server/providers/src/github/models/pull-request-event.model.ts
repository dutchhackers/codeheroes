import { GitHubBaseEventData, Sender } from './base-event.model';

export interface GithubPullRequestMetrics {
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
}

export interface GithubPullRequestEventData extends GitHubBaseEventData {
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
  metrics?: GithubPullRequestMetrics;
}
