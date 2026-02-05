import { DatabaseService, logger, WebhookService } from '@codeheroes/common';
import { GameActionService, ProviderFactory } from '@codeheroes/integrations';
import { Request, Response } from 'express';
import { ErrorType, MESSAGES } from './core/constants/constants';
import { GitHubError } from './core/errors/github-event.error';
import { ResponseHandler } from './core/utils/response.handler';
import { EventProcessor } from './processor/event-processor';
import { GitHubWebhookEvent } from './processor/interfaces';

export const App = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get provider adapter from factory
    const providerName = 'github';

    if (!ProviderFactory.supportsProvider(providerName)) {
      throw new Error(`Unsupported provider: ${providerName}`);
    }

    const providerAdapter = ProviderFactory.getProvider(providerName);

    // Validate webhook using the provider adapter
    const validation = providerAdapter.validateWebhook(req.headers, req.body);

    if (!validation.isValid) {
      logger.error('Invalid webhook', { error: validation.error });
      throw new GitHubError(validation.error || MESSAGES.MISSING_HEADERS, ErrorType.VALIDATION);
    }

    const eventType = validation.eventType || (req.headers['x-github-event'] as string);
    const eventId = validation.eventId || (req.headers['x-github-delivery'] as string);

    logger.log('Processing event:', `${providerName}.${eventType}${req.body?.action ? `.${req.body.action}` : ''}`);

    // Extract user ID using provider adapter
    const externalUserId = providerAdapter.extractUserId(req.body);

    if (!externalUserId) {
      logger.warn('No sender ID in webhook payload');
      ResponseHandler.success(res, MESSAGES.EVENT_PROCESSED);
      return;
    }

    // Store the raw webhook
    const webhookService = new WebhookService();
    await webhookService.storeRawWebhook(req, providerName, {
      eventType,
      eventId,
    });

    // Convert to internal webhook event format
    // Keep compatibility with existing GitHubWebhookEvent format for now
    const eventData: GitHubWebhookEvent = {
      eventId,
      eventType,
      payload: req.body,
      headers: req.headers,
      provider: providerName,
    };

    // Process the event - this includes duplicate check
    const processor = new EventProcessor(eventData);
    const result = await processor.process();

    // Check for duplicate or failed event processing BEFORE creating game action
    // This prevents duplicate game actions from being created when webhooks are redelivered
    if (!result.success) {
      if (result.error) {
        throw result.error;
      }
      logger.info('Event already processed or skipped, not creating game action', {
        eventId,
        message: result.message,
      });
      ResponseHandler.success(res, result.message);
      return;
    }

    // Lookup internal user ID
    const databaseService = new DatabaseService();
    const userId = await databaseService.lookupUserId({
      sender: {
        id: externalUserId,
      },
      provider: providerName,
    });

    if (!userId) {
      logger.warn('No matching user found for webhook', {
        provider: providerName,
        externalUserId,
      });
      ResponseHandler.success(res, MESSAGES.EVENT_PROCESSED);
      return;
    }

    // Create game action from webhook payload
    // Only reached if event was not a duplicate
    const gameActionService = new GameActionService();
    await gameActionService.generateGameActionFromWebhook({
      payload: eventData.payload,
      provider: eventData.provider,
      eventType: eventData.eventType,
      userId,
      eventId, // Pass eventId for deterministic game action ID
    });

    ResponseHandler.success(res, MESSAGES.EVENT_PROCESSED);
  } catch (error) {
    if (error instanceof GitHubError && error.type === ErrorType.UNSUPPORTED_EVENT) {
      logger.info(
        'Unsupported event:',
        `github.${req.headers['x-github-event']}${req.body?.action ? `.${req.body.action}` : ''}`,
      );
      // Silently handle unsupported events
      ResponseHandler.handleError(error, res);
      return;
    }

    logger.error('Error processing webhook event', { error });
    ResponseHandler.handleError(error, res);
  }
};
