import { BaseDocument, ConnectedAccountProvider } from '../core/models/common.model';

export interface EventSource {
  id: string;
  timestamp: string; // ISO string
  event: string;  // Added here
}

export interface WebhookEvent extends BaseDocument {
  type: string;
  provider: ConnectedAccountProvider;
  source: EventSource;
  data: Record<string, unknown>;
}
