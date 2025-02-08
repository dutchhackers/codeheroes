import { GitHubBaseEventData } from './base-event.model';

export interface GithubPullRequestReviewThreadEventData extends GitHubBaseEventData {
  repository: {
    id: string;
    name: string;
    owner: string;
    ownerType: 'User' | 'Organization';
  };
  action: 'resolved' | 'unresolved';
  prNumber: number;
  prTitle: string;
  threadId: number;
  resolved: boolean;
  resolver?: {
    id: string;
    login: string;
  };
  sender: {
    id: string;
    login: string;
  };
}
