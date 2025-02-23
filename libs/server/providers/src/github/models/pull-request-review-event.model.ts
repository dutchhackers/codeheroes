import { GitHubBaseEventData } from './base-event.model';

export interface GithubPullRequestReviewMetrics {
  commentsCount: number;
  threadCount: number;
  changedFiles: number;
  suggestionsCount: number;
}

export interface GithubPullRequestReviewEventData extends GitHubBaseEventData {
  repository: {
    id: string;
    name: string;
    owner: string;
    ownerType: 'User' | 'Organization';
  };
  action: 'submitted' | 'edited' | 'dismissed';
  state: 'approved' | 'commented' | 'changes_requested';
  id: string;
  prNumber: number;
  prTitle: string;
  reviewer: {
    id: string;
    login: string;
  };
  submittedAt: string;
}
