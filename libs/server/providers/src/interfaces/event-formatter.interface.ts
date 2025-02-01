import { WebhookEvent } from '@codeheroes/event';

export interface IEventFormatter {
  getProvider(): string;
  formatDescription(event: WebhookEvent): string;
}