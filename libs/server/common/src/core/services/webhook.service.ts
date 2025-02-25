import { PubSub } from '@google-cloud/pubsub';
import { Request } from 'express';
import { RawWebhookData } from '../models/webhook.model';
import { logger } from '../firebase';
import { ConnectedAccountProvider } from '../models/common.model';

export interface WebhookHeaders {
  eventType: string;
  eventId: string;
}

export class WebhookService {
  private pubsub: PubSub;
  private readonly topicName = 'raw-webhooks';

  constructor() {
    this.pubsub = new PubSub();
  }

  async storeRawWebhook(req: Request, provider: ConnectedAccountProvider, headers: WebhookHeaders): Promise<void> {
    if (!headers.eventType || !headers.eventId) {
      throw new Error('Missing required headers');
    }

    const message: RawWebhookData = {
      eventId: headers.eventId.toString(),
      eventType: headers.eventType.toString(),
      provider,
      headers: req.headers,
      payload: req.body,
      receivedAt: new Date().toISOString(),
    };

    try {
      await this.pubsub.topic(this.topicName).publish(Buffer.from(JSON.stringify(message)));
      logger.info('Raw webhook published to Pub/Sub', {
        eventId: headers.eventId,
        eventType: headers.eventType,
        provider,
      });
    } catch (error) {
      logger.error('Failed to publish webhook to Pub/Sub', {
        error,
        eventId: headers.eventId,
        eventType: headers.eventType,
        provider,
      });
      throw error;
    }
  }
}
