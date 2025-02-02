import { GitHubBaseEventData } from './base-event.model';

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
}
