import { BaseDocument, ConnectedAccountProvider } from '.';

// Event Document
export interface WebhookEvent extends BaseDocument {
  source: ConnectedAccountProvider;
  eventId: string;
  actor: string;
  eventTimestamp: string; // ISO string
  data: Record<string, unknown>;
}

export type CreateEventInput = Omit<
  WebhookEvent,
  'id' | 'createdAt' | 'updatedAt'
>;
