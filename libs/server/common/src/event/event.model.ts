import { BaseDocument, ConnectedAccountProvider } from '../core/models/common.model';

export interface Source {
  id: string;
  timestamp: string; // ISO string
  eventType: string;  // Added here
}

export interface WebhookEvent extends BaseDocument {
  type: string;
  provider: ConnectedAccountProvider;
  source: Source;
  data: Record<string, unknown>;
}
