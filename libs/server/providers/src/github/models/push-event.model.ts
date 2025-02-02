import { GitHubBaseEventData } from './base-event.model';

export interface CommitData {
  id: string;
  message: string;
  timestamp: string;
  author: {
    name: string;
    email: string;
  };
  url: string;
}

export interface PushEventMetrics {
  commits: number;
}

export interface PushEventData extends GitHubBaseEventData {
  branch: string;
  metrics?: PushEventMetrics;
  created: boolean;
  deleted: boolean;
  forced: boolean;
  pusher: {
    name: string;
    email: string;
  };
  commits: CommitData[];
}
