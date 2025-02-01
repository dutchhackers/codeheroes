import { Event } from '@codeheroes/event';

export interface IEventProvider<T = any> {
  readonly name: string;
  parseEventData(event: Event): T;
  formatDescription(event: Event): string;
}
