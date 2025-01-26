import { EventSource } from '../enums/event-source';
import { GitHubEventTypes, JiraEventTypes } from '../enums/event-types';
import { IEventArgs } from './event-args';

export interface IEvent {
  source: EventSource;
  type: GitHubEventTypes | JiraEventTypes;
  action?: string;
  args?: IEventArgs;
}
