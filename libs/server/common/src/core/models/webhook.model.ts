import { ConnectedAccountProvider } from '@codeheroes/shared/types';
import { IncomingHttpHeaders } from 'http';

export interface RawWebhookData {
  eventId: string;
  eventType: string;
  provider: ConnectedAccountProvider;
  headers: IncomingHttpHeaders;
  payload: unknown;
  receivedAt: string;
}
