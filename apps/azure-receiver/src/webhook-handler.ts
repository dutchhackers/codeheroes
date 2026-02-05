import { Request, Response } from 'express';
import { DatabaseService, logger, WebhookService } from '@codeheroes/common';
import { GameActionService, ProviderFactory } from '@codeheroes/integrations';
import { EventService } from '@codeheroes/event';

const PROVIDER_NAME = 'azure';

export async function processAzureWebhook(req: Request, res: Response): Promise<void> {
  const webhookService = new WebhookService();
  const eventService = new EventService();

  try {
    // Verify provider support
    if (!ProviderFactory.supportsProvider(PROVIDER_NAME)) {
      logger.error(`Provider ${PROVIDER_NAME} not supported`);
      res.status(500).send(`Provider ${PROVIDER_NAME} is not configured`);
      return;
    }

    const providerAdapter = ProviderFactory.getProvider(PROVIDER_NAME);

    // Validate the incoming webhook
    const validationResult = providerAdapter.validateWebhook(req.headers, req.body);

    if (!validationResult.isValid) {
      logger.error('Webhook validation failed', { error: validationResult.error });
      res.status(400).send(validationResult.error || 'Invalid webhook payload');
      return;
    }

    const { eventType, eventId } = validationResult;
    logger.log(`Received Azure DevOps event: ${eventType} (ID: ${eventId})`);

    // Extract the user who triggered this event
    const externalUserId = providerAdapter.extractUserId(req.body);
    if (!externalUserId) {
      logger.warn('No user identifier found in webhook payload');
      res.status(200).send('Webhook received but no user identified');
      return;
    }

    // Store raw webhook for audit trail
    await webhookService.storeRawWebhook(req, PROVIDER_NAME, {
      eventType: eventType!,
      eventId: eventId!,
    });

    // Check if this event was already processed
    const existingEvent = await eventService.findByEventId(eventId!);
    if (existingEvent) {
      logger.info(`Event ${eventId} was already processed, skipping`);
      res.status(200).send('Event already processed');
      return;
    }

    // Record the event
    const newEvent = await eventService.createEvent(
      {
        provider: PROVIDER_NAME as any,
        source: {
          id: eventId!,
          event: eventType!,
        },
      },
      {}
    );

    logger.info(`Event ${eventId} recorded successfully`);

    // Find the internal user ID
    const databaseService = new DatabaseService();
    const internalUserId = await databaseService.lookupUserId({
      sender: { id: externalUserId },
      provider: PROVIDER_NAME,
    });

    if (!internalUserId) {
      logger.warn(`No internal user found for Azure user ${externalUserId}`);
      res.status(200).send('Webhook received but user not registered');
      return;
    }

    // Generate game action from the webhook
    const gameActionService = new GameActionService();
    await gameActionService.generateGameActionFromWebhook({
      payload: req.body,
      provider: PROVIDER_NAME,
      eventType: eventType!,
      userId: internalUserId,
      eventId: eventId!,
    });

    logger.info(`Game action created for event ${eventId}`);
    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    logger.error('Failed to process Azure webhook', { error });
    res.status(500).send('Internal server error processing webhook');
  }
}
