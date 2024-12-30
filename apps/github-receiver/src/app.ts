import { EventService, logger } from '@codeheroes/common';
import { ProcessorFactory } from './core/factory/factory.processor';
import { PushEvent } from './core/interfaces/github.interface';
import { ResponseHandler } from './core/utils/response.handler';
import { HTTP_MESSAGES } from './core/constants/http.constants';

export const App = async (req, res) => {
  const githubEvent = req.headers['x-github-event'];
  const payload = req.body;

  if (!githubEvent) {
    return ResponseHandler.badRequest(res, HTTP_MESSAGES.MISSING_GITHUB_EVENT);
  }

  const eventService = new EventService();

  try {
    const processor = ProcessorFactory.createProcessor(githubEvent, eventService);
    const event = await processor.process(payload as PushEvent, req.headers);

    if (!event) {
      return ResponseHandler.success(res, HTTP_MESSAGES.DUPLICATE_EVENT);
    }

    console.log('Creating event:', event);

    await eventService.createEvent(event);
    logger.info('Event created successfully');
    return ResponseHandler.success(res, HTTP_MESSAGES.EVENT_PROCESSED);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unknown event type:')) {
      logger.info(`Skipping unsupported event type: ${githubEvent}`);
      return ResponseHandler.success(res, HTTP_MESSAGES.UNSUPPORTED_EVENT(githubEvent));
    }
    
    logger.error('Failed to process event:', error);
    return ResponseHandler.error(res, HTTP_MESSAGES.PROCESSING_ERROR);
  }
};
