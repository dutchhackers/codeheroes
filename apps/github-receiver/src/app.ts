import { logger } from '@codeheroes/common';
import { Request, Response } from 'express';
import { HTTP_MESSAGES } from './core/constants/http.constants';
import { ProcessorFactory } from './core/factory/factory.processor';
import { GitHubEventUtils } from './core/utils/github-event.utils';
import { ResponseHandler } from './core/utils/response.handler';

export const App = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventDetails = GitHubEventUtils.parseWebhookRequest(req);
    const processor = ProcessorFactory.createProcessor(eventDetails);
    const result = await processor.process();

    if (result.success) {
      ResponseHandler.success(res, HTTP_MESSAGES.EVENT_PROCESSED);
      return;
    }

    if (result.error) {
      throw result.error;
    }

    ResponseHandler.success(res, result.message);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith('Unknown event type:')) {
        logger.info(
          `Skipping unsupported event type: ${error.message
            .split(':')[1]
            .trim()}`
        );
        ResponseHandler.success(
          res,
          HTTP_MESSAGES.UNSUPPORTED_EVENT(error.message.split(':')[1].trim())
        );
        return;
      }
    }

    logger.error('Failed to process event:', error);
    ResponseHandler.error(res, HTTP_MESSAGES.PROCESSING_ERROR);
  }
};
