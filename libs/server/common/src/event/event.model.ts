import { BaseDocument, ConnectedAccountProvider } from '../core/models/common.model';

export interface Source {
  id: string;
  timestamp: string; // ISO string
}

export interface WebhookEvent extends BaseDocument {
  type: string;
  provider: ConnectedAccountProvider;
  eventType: string; // e.g., 'push', 'pull_request', etc.
  source: Source;
  data: Record<string, unknown>;
}
