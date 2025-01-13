import { BaseDocument, ConnectedAccountProvider } from '.';

export interface Publisher {
  source: ConnectedAccountProvider;
  type: string;  // e.g., 'push', 'pull_request', etc.
}

export interface WebhookEvent extends BaseDocument {
  publisher: Publisher;
  eventId: string;
  eventType: string;
  eventTimestamp: string; // ISO string
  data: Record<string, unknown>;
}

export type CreateEventInput = Omit<
  WebhookEvent,
  'id' | 'createdAt' | 'updatedAt'
>;
