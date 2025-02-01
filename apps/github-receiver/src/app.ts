import { logger, StorageService } from '@codeheroes/common';
import { Request, Response } from 'express';
import { ErrorType, MESSAGES } from './core/constants/constants';
import { GitHubError } from './core/errors/github-event.error';
import { ResponseHandler } from './core/utils/response.handler';
import { EventProcessor } from './core/processors/event-processor';
import { GitHubEventUtils } from './core/processors/utils';
import { EventStorageUtils } from './core/utils/event-storage.utils';

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

    // Store the raw event
    const storageService = new StorageService();
    const filePath = EventStorageUtils.generateFilePath(eventData);
    const headers = EventStorageUtils.formatHeaders(eventData.headers);
    const content = `${headers}\n\n${JSON.stringify(eventData.payload, null, 2)}`;
    await storageService.storeFile(filePath, content, { contentType: 'text/plain' });

    // Process the event
    const processor = new EventProcessor(eventData);
    const result = await processor.process();

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
    
    logger.error('Event processing error:', error);
    ResponseHandler.handleError(error, res);
  }
};
