import { BaseDocument, ConnectedAccountProvider } from '.';

// Event Document
export interface WebhookEvent extends BaseDocument {
  action: string; // e.g. 'github.push', 'github.pull_request.opened', 'github.pull_request.merged'
  source: ConnectedAccountProvider;
  eventId: string;
  eventTimestamp: string; // ISO string
  details: Record<string, unknown>;
  processed: boolean;
}

export type CreateEventInput = Omit<
  WebhookEvent,
  'id' | 'createdAt' | 'updatedAt'
>;
