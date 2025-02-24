import { GitHubBaseEventData, Sender } from './base-event.model';

export interface GithubPullRequestMetrics {
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: number;
  reviewers: number;
}

export interface GithubPullRequestEventData extends GitHubBaseEventData {
  id: string;
  action: 'opened' | 'closed' | 'reopened' | 'synchronize' | 'edited' | string;
  prNumber: number;
  title: string;
  state: string;
  draft: boolean;
  merged: boolean;
  branch: string;
  baseBranch: string;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  mergedBy?: Sender;
  metrics?: GithubPullRequestMetrics;
}
