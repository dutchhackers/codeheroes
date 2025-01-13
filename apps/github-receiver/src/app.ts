import { logger } from '@codeheroes/common';
import { Request, Response } from 'express';
import { SupportedGitHubEventActions } from './core/constants/github.constants';
import { HTTP_MESSAGES } from './core/constants/http.constants';
import { GitHubEventError, UnsupportedEventError } from './core/errors/github-event.error';
import { ResponseHandler } from './core/utils/response.handler';
import { ProcessorFactory } from './core/processors/factory';
import { GitHubEventUtils } from './core/processors/utils';

export const App = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse event action first
    const eventAction = GitHubEventUtils.parseEventAction(req);
    
    // Validate action type
    if (!SupportedGitHubEventActions.includes(eventAction)) {
      throw new UnsupportedEventError(`action:${eventAction}`);
    }

    // Parse and validate request
    let eventDetails;
    try {
      eventDetails = GitHubEventUtils.parseWebhookRequest(req);
    } catch (error) {
      logger.error('Failed to parse GitHub event:', error);
      throw new GitHubEventError(HTTP_MESSAGES.MISSING_GITHUB_EVENT);
    }

    // Validate event type
    if (!SupportedGitHubEventActions.includes(eventDetails.eventType)) {
      throw new UnsupportedEventError(`event:${eventDetails.eventType}`);
    }

    // Process the event
    const processor = ProcessorFactory.createProcessor(eventDetails);
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
