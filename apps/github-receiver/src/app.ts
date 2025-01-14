import { logger } from '@codeheroes/common';
import { Request, Response } from 'express';
import { MESSAGES } from './core/constants/constants';
import { GitHubError } from './core/errors/github-event.error';
import { ResponseHandler } from './core/utils/response.handler';
import { ProcessorFactory } from './core/processors/factory';
import { GitHubEventUtils } from './core/processors/utils';

export const App = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse and validate request
    let eventDetails;
    try {
      eventDetails = GitHubEventUtils.validateAndParseWebhook(req);
      logger.log('Processing event:', GitHubEventUtils.parseEventAction(req));
    } catch (error) {
      throw error instanceof Error ? error : new GitHubError(MESSAGES.MISSING_GITHUB_EVENT);
    }

    // Process the event
    const processor = ProcessorFactory.createProcessor(eventDetails);
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
    logger.error('Event processing error:', error);
    ResponseHandler.handleError(error, res);
  }
};
