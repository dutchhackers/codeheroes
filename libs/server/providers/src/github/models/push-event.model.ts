import { GitHubBaseEventData } from './base-event.model';

export interface PushEventMetrics {
  commits: number;
}

export interface PushEventData extends GitHubBaseEventData {
  branch: string;
  metrics?: PushEventMetrics;
}
