import { Event } from '@codeheroes/event';

export interface ProcessResult {
  success: boolean;
  message: string;
  error?: Error;
  event?: Event;
}

export interface GitHubWebhookEvent {
  eventId: string;
  eventType: string;
  signature?: string;
  payload: unknown;
  headers: Record<string, string | string[] | undefined>;
  provider: string;
}
