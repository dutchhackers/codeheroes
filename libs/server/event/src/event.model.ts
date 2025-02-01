import { BaseDocument, ConnectedAccountProvider } from '@codeheroes/common';

export interface EventSource {
  id: string;
  timestamp: string; // ISO string
  event: string;
}

export interface Event extends BaseDocument {
  type: string;
  provider: ConnectedAccountProvider;
  source: EventSource;
  data: Record<string, unknown>;
}
