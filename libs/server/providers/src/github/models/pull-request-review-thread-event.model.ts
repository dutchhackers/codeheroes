import { BaseEventData } from './base-event.model';

export interface PullRequestReviewThreadEventData extends BaseEventData {
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
