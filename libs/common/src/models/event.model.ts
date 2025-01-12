import { BaseDocument, ConnectedAccountProvider } from '.';

interface Actor {
  id: string;
  username?: string;
}

// Event Document
export interface WebhookEvent extends BaseDocument {
  source: ConnectedAccountProvider;
  eventId: string;
  actor: Actor;
  eventTimestamp: string; // ISO string
  data: Record<string, unknown>;
}

export type CreateEventInput = Omit<
  WebhookEvent,
  'id' | 'createdAt' | 'updatedAt'
>;
