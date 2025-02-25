import { GitHubBaseEventData } from './base-event.model';

export interface GithubCommitData {
  id: string;
  message: string;
  timestamp: string;
  author: {
    name: string;
    email: string;
    username?: string;
  };
  committer?: {
    name: string;
    email: string;
    username?: string;
  };
  url: string;
}

export interface GithubPushEventMetrics {
  commits: number;
}

export interface GithubPushEventData extends GitHubBaseEventData {
  branch: string;
  metrics?: GithubPushEventMetrics;
  created: boolean;
  deleted: boolean;
  forced: boolean;
  pusher: {
    name: string;
    email: string;
  };
  commits: GithubCommitData[];
}
