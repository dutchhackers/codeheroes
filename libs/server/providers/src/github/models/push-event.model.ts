import { BaseEventData } from './base-event.model';

export interface PushEventMetrics {
  commits: number;
}

export interface PushEventData extends BaseEventData {
  branch: string;
  metrics?: PushEventMetrics;
}
