import { GitHubBaseEventData } from './base-event.model';

export interface GithubPullRequestReviewCommentEventData extends GitHubBaseEventData {
  repository: {
    id: string;
    name: string;
    owner: string;
    ownerType: 'User' | 'Organization';
  };
  action: 'created' | 'edited' | 'deleted';
  prNumber: number;
  prTitle: string;
  comment: {
    id: number;
    createdAt: string;
    updatedAt: string;
    inReplyToId?: number;
  };
  author: {
    id: string;
    login: string;
  };
  sender: {
    id: string;
    login: string;
  };
}
