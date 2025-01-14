import { logger, StorageService } from '@codeheroes/common';
import { Request, Response } from 'express';
import { HTTP_MESSAGES } from './core/constants/http.constants';
import { GitHubEventError, UnsupportedEventError } from './core/errors/github-event.error';
import { ResponseHandler } from './core/utils/response.handler';
import { ProcessorFactory } from './core/processors/factory';
import { GitHubEventUtils } from './core/processors/utils';
import { GitHubStorageUtils } from './core/utils/github-storage.utils';

export const App = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse and validate request
    let eventDetails;
    try {
      eventDetails = GitHubEventUtils.validateAndParseWebhook(req);
      logger.log('Processing event:', GitHubEventUtils.parseEventAction(req));

      // Store raw event
      const storageService = new StorageService();
      await GitHubStorageUtils.storeGitHubEvent(storageService, eventDetails).catch(error => {
        logger.error(`Failed to store raw event ${eventDetails.eventId}:`, error);
      });
      
    } catch (error) {
      // logger.error('Failed to parse GitHub event:', error);
      throw error instanceof Error ? error : new GitHubEventError(HTTP_MESSAGES.MISSING_GITHUB_EVENT);
    }

    // Process the event
    const processor = ProcessorFactory.createProcessor(eventDetails);

    const eventData = processor.getEventData();
    logger.info('Processing event:', eventData);

    const result = await processor.process();

    // Handle the result
    if (!result.success) {
      if (result.error) {
        throw result.error;
      }
      // Handle non-error cases (like duplicates)
      ResponseHandler.success(res, result.message);
      return;
    }

    ResponseHandler.success(res, HTTP_MESSAGES.EVENT_PROCESSED);
  } catch (error) {
    handleError(error, res);
  }
};

const handleError = (error: unknown, res: Response): void => {
  if (error instanceof UnsupportedEventError) {
    const eventType = error.message.split(':')[1].trim();
    logger.info(`Skipping unsupported event type: ${eventType}`);
    ResponseHandler.success(res, HTTP_MESSAGES.UNSUPPORTED_EVENT(eventType));
    return;
  }

  if (error instanceof GitHubEventError) {
    logger.error('GitHub event error:', error);
    ResponseHandler.badRequest(res, error.message);
    return;
  }

  logger.error('Failed to process event:', error);
  ResponseHandler.error(res, HTTP_MESSAGES.PROCESSING_ERROR);
};
