import { BaseDocument, ConnectedAccountProvider } from '../core/models/common.model';

export interface WebhookEvent extends BaseDocument {
  type: string;
  source: ConnectedAccountProvider;
  eventType: string; // e.g., 'push', 'pull_request', etc.
  externalId: string;
  externalTimestamp: string; // ISO string
  data: Record<string, unknown>;
}
