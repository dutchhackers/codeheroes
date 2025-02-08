import { GitHubBaseEventData } from './base-event.model';

export interface GithubDeleteEventData extends GitHubBaseEventData {
  ref: string;
  refType: 'branch' | 'tag';
  pusherType: string;
}
