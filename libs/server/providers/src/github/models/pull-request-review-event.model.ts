import { GitHubBaseEventData } from './base-event.model';

export interface GithubPullRequestReviewEventData extends GitHubBaseEventData {
  repository: {
    id: string;
    name: string;
    owner: string;
    ownerType: 'User' | 'Organization';
  };
  action: 'submitted' | 'edited' | 'dismissed';
  state: 'approved' | 'commented' | 'changes_requested';
  prNumber: number;
  prTitle: string;
  reviewer: {
    id: string;
    login: string;
  };
  submittedAt: string;
}
