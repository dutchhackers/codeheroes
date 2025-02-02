import { GitHubBaseEventData } from './base-event.model';

export interface DeleteEventData extends GitHubBaseEventData {
  ref: string;
  refType: 'branch' | 'tag';
  pusherType: string;
}
