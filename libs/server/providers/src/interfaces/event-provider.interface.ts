import { WebhookEvent } from '@codeheroes/event';

export interface IEventProvider<T = any> {
  readonly name: string;
  parseEventData(event: WebhookEvent): T;
  formatDescription(event: WebhookEvent): string;
}
