import { BaseDocument, ConnectedAccountProvider } from '.';

export interface EventSource {
  provider: ConnectedAccountProvider;
  type: string;  // e.g., 'push', 'pull_request', etc.
  externalEventId: string;
  externalEventTimestamp: string; // ISO string
}

export interface Event extends BaseDocument {
  type: string;
  source: EventSource;
  data: Record<string, unknown>;
}

