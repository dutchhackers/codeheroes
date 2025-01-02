import { Request, Response } from 'express';
import { logger } from '@codeheroes/common';
import { ProcessorFactory } from './core/factory/factory.processor';
import { ResponseHandler } from './core/utils/response.handler';
import { HTTP_MESSAGES } from './core/constants/http.constants';
import { StorageService } from './core/storage';
import { GitHubEventUtils } from './core/utils/github-event.utils';

export const App = async (req: Request, res: Response): Promise<void> => {
  let eventDetails;
  try {
    eventDetails = GitHubEventUtils.parseWebhookRequest(req);
  } catch (error) {
    logger.error('Failed to process webhook request:', error);
    ResponseHandler.badRequest(res, HTTP_MESSAGES.MISSING_GITHUB_EVENT);
    return;
  }

  try {
    const storageService = new StorageService();
    await storageService.storeRawRequest(eventDetails);
  } catch (error) {
    logger.error('Failed to store raw request:', error);
  }

  try {
    const processor = ProcessorFactory.createProcessor(eventDetails);
    const processed = await processor.process();

    if (!processed) {
      ResponseHandler.success(res, HTTP_MESSAGES.DUPLICATE_EVENT);
      return;
    }

    ResponseHandler.success(res, HTTP_MESSAGES.EVENT_PROCESSED);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unknown event type:')) {
      logger.info(`Skipping unsupported event type: ${eventDetails.eventType}`);
      ResponseHandler.success(res, HTTP_MESSAGES.UNSUPPORTED_EVENT(eventDetails.eventType));
      return;
    }

    logger.error('Failed to process event:', error);
    ResponseHandler.error(res, HTTP_MESSAGES.PROCESSING_ERROR);
  }
};
