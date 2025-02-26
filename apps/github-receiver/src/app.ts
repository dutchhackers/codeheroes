import { DatabaseService, logger, WebhookService } from '@codeheroes/common';
import { GameActionService } from '@codeheroes/game-core';
import { Request, Response } from 'express';
import { ErrorType, MESSAGES } from './core/constants/constants';
import { GitHubError } from './core/errors/github-event.error';
import { ResponseHandler } from './core/utils/response.handler';
import { EventProcessor } from './processor/event-processor';
import { GitHubEventUtils } from './processor/utils';

export const App = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse and validate request
    let eventData;
    try {
      eventData = GitHubEventUtils.validateAndParseWebhook(req);
      logger.log('Processing event:', GitHubEventUtils.parseEventAction(req));
    } catch (error) {
      throw error instanceof Error ? error : new GitHubError(MESSAGES.MISSING_GITHUB_EVENT);
    }

    // Store the raw webhook with GitHub-specific headers
    const webhookService = new WebhookService();
    await webhookService.storeRawWebhook(req, 'github', {
      eventType: req.headers['x-github-event'] as string,
      eventId: req.headers['x-github-delivery'] as string,
    });

    // Process the event
    const processor = new EventProcessor(eventData);
    const result = await processor.process();

    // Lookup internal user ID
    const databaseService = new DatabaseService();
    const externalUserId = req.body.sender?.id?.toString();
    if (!externalUserId) {
      logger.warn('No sender ID in webhook payload');
      ResponseHandler.success(res, MESSAGES.EVENT_PROCESSED);
      return;
    }

    const userId = await databaseService.lookupUserId({
      sender: {
        id: externalUserId,
      },
      provider: 'github',
    });

    if (!userId) {
      logger.warn('No matching user found for webhook', {
        provider: 'github',
        externalUserId,
      });
      ResponseHandler.success(res, MESSAGES.EVENT_PROCESSED);
      return;
    }

    // Create game action from webhook payload
    const gameActionService = new GameActionService();
    await gameActionService.generateGameActionFromWebhook({
      payload: eventData.payload,
      provider: eventData.provider,
      eventType: eventData.eventType,
      userId,
    });

    if (!result.success) {
      if (result.error) {
        throw result.error;
      }
      ResponseHandler.success(res, result.message);
      return;
    }

    ResponseHandler.success(res, MESSAGES.EVENT_PROCESSED);
  } catch (error) {
    if (error instanceof GitHubError && error.type === ErrorType.UNSUPPORTED_EVENT) {
      logger.info('Unsupported event:', GitHubEventUtils.parseEventAction(req));
      // Silently handle unsupported events
      ResponseHandler.handleError(error, res);
      return;
    }

    logger.error('Error processing GitHub event', { error });
    ResponseHandler.handleError(error, res);
  }
};
