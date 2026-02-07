import { Request, Response } from 'express';
import { DatabaseService, logger, WebhookService } from '@codeheroes/common';
import { CreateEventInput, EventService } from '@codeheroes/event';
import { ConnectedAccountProvider } from '@codeheroes/types';
import { ProviderFactory } from '../providers/provider.factory';
import { GameActionService } from '../services/game-action.service';
import { WebhookEvent, WebhookProcessResult } from './webhook-event.types';

export interface WebhookPipelineParams {
  req: Request;
  res: Response;
  provider: ConnectedAccountProvider;
  secret?: string;
}

export async function processWebhook({ req, res, provider, secret }: WebhookPipelineParams): Promise<void> {
  try {
    // Step 1: Verify provider support
    if (!ProviderFactory.supportsProvider(provider)) {
      logger.error(`Provider ${provider} not supported`);
      res.status(500).send(`Provider ${provider} is not configured`);
      return;
    }

    const providerAdapter = ProviderFactory.getProvider(provider);

    // Step 2: Validate webhook using the provider adapter
    const validation = providerAdapter.validateWebhook(req.headers, req.body, secret);

    if (!validation.isValid) {
      logger.error('Webhook validation failed', { provider, error: validation.error });
      res.status(400).send(validation.error || 'Invalid webhook payload');
      return;
    }

    if (!validation.eventType || !validation.eventId) {
      logger.error('Webhook validation missing eventType or eventId', { provider });
      res.status(400).send('Invalid webhook payload: missing event identifiers');
      return;
    }

    const eventType = validation.eventType;
    const eventId = validation.eventId;

    logger.log('Processing event:', `${provider}.${eventType}${req.body?.action ? `.${req.body.action}` : ''}`);

    // Step 3: Extract user ID using provider adapter
    const externalUserId = providerAdapter.extractUserId(req.body);

    if (!externalUserId) {
      logger.warn('No sender ID in webhook payload', { provider });
      res.status(200).send('Event processed successfully');
      return;
    }

    // Step 4: Store the raw webhook
    const webhookService = new WebhookService();
    await webhookService.storeRawWebhook(req, provider, { eventType, eventId });

    // Step 5: Check for duplicate events and create event record
    const result = await processEvent({ eventId, eventType, payload: req.body, headers: req.headers, provider });

    if (!result.success) {
      if (result.error) {
        throw result.error;
      }
      logger.info('Event already processed or skipped', { eventId, message: result.message });
      res.status(200).send(result.message);
      return;
    }

    // Step 6: Lookup internal user ID
    const databaseService = new DatabaseService();
    const userId = await databaseService.lookupUserId({
      sender: { id: externalUserId },
      provider,
    });

    if (!userId) {
      logger.warn('No matching user found for webhook', { provider, externalUserId });
      res.status(200).send('Event processed successfully');
      return;
    }

    // Step 7: Create game action from webhook payload
    const gameActionService = new GameActionService();
    await gameActionService.generateGameActionFromWebhook({
      payload: req.body,
      provider,
      eventType,
      userId,
      eventId,
    });

    // Step 8: Respond
    logger.info(`Game action created for event ${eventId}`);
    res.status(200).send('Event processed successfully');
  } catch (error) {
    logger.error('Error processing webhook event', { provider, error });
    res.status(500).send('Internal server error processing webhook');
  }
}

async function processEvent(webhookEvent: WebhookEvent): Promise<WebhookProcessResult> {
  const eventService = new EventService();

  try {
    // Check for duplicate events
    const existingEvent = await eventService.findByEventId(webhookEvent.eventId);
    if (existingEvent) {
      logger.info(`Event ${webhookEvent.eventId} already processed`);
      return {
        success: false,
        message: `Event ${webhookEvent.eventId} already processed`,
        event: existingEvent,
      };
    }

    // Create and store the event
    const createEventInput: CreateEventInput = {
      provider: webhookEvent.provider as ConnectedAccountProvider,
      source: {
        id: webhookEvent.eventId,
        event: webhookEvent.eventType,
      },
    };
    const newEvent = await eventService.createEvent(createEventInput, {});

    logger.info(`Successfully processed ${webhookEvent.eventType} event`);
    return {
      success: true,
      message: 'Event processed successfully',
      event: newEvent,
    };
  } catch (error) {
    logger.error('Failed to process event:', error);
    return {
      success: false,
      message: 'Failed to process event',
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
