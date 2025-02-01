import { BaseDocument, ConnectedAccountProvider } from '@codeheroes/common';

export interface EventSource {
  id: string;
  event: string;
}

export interface Event extends BaseDocument {
  provider: ConnectedAccountProvider;
  source: EventSource;
  data: Record<string, unknown>;
}
