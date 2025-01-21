import { BaseDocument, ConnectedAccountProvider } from '.';

export interface WebhookEvent extends BaseDocument {
  type: string;
  provider: ConnectedAccountProvider;
  eventType: string; // e.g., 'push', 'pull_request', etc.
  externalEventId: string;
  externalEventTimestamp: string; // ISO string
  data: Record<string, unknown>;
}

export type CreateEventInput = Omit<WebhookEvent, 'id' | 'createdAt' | 'updatedAt'>;
