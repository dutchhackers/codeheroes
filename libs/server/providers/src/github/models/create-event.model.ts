import { GitHubBaseEventData } from './base-event.model';

export interface GithubCreateEventData extends GitHubBaseEventData {
  ref: string;
  refType: 'branch' | 'tag' | 'repository';
  masterBranch: string;
  pusherType: string;
}
