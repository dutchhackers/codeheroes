import { IncomingHttpHeaders } from 'http';
import { ConnectedAccountProvider } from './common.model';

export interface RawWebhookData {
  eventId: string;
  eventType: string;
  provider: ConnectedAccountProvider;
  headers: IncomingHttpHeaders;
  payload: unknown;
  receivedAt: string;
}
