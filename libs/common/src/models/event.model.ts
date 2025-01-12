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
  eventData: Record<string, unknown>;
  processed: boolean;
}

export type CreateEventInput = Omit<
  WebhookEvent,
  'id' | 'createdAt' | 'updatedAt'
>;
