import { WebhookEvent } from './event.model';

export interface IEventFormatter {
  getProvider(): string;
  formatDescription(event: WebhookEvent): string;
}