import { Event } from '@codeheroes/event';

export interface WebhookEvent {
  eventId: string;
  eventType: string;
  payload: unknown;
  headers: Record<string, string | string[] | undefined>;
  provider: string;
}

export interface WebhookProcessResult {
  success: boolean;
  message: string;
  error?: Error;
  event?: Event;
}
