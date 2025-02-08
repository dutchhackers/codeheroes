import { GitHubBaseEventData } from './base-event.model';

export interface CreateEventData extends GitHubBaseEventData {
  ref: string;
  refType: 'branch' | 'tag' | 'repository';
  masterBranch: string;
  pusherType: string;
}
