import { BaseDocument, ConnectedAccountProvider } from '@codeheroes/types';

export interface EventSource {
  id: string;
  event: string;
}

export interface Event extends BaseDocument {
  provider: ConnectedAccountProvider; // Open question: should this be called 'platform'?
  source: EventSource;
  data?: Record<string, unknown>;
}
