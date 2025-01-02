import { Request, Response } from 'express';
import { EventService, logger } from '@codeheroes/common';
import { ProcessorFactory } from './core/factory/factory.processor';
import { PushEvent } from './core/interfaces/github.interface';
import { ResponseHandler } from './core/utils/response.handler';
import { HTTP_MESSAGES } from './core/constants/http.constants';
import { StorageService } from './core/storage';

export const App = async (req: Request, res: Response): Promise<void> => {
  // TODO: this method should
  // 1. Filter out unsupported events
  // 2. Store the raw request
  // 3. Process the event

  const eventId = req.headers['x-github-delivery'] as string;
  const githubEvent = req.headers['x-github-event'] as string;
  // const signature = req.headers['x-hub-signature-256'] as string;

  const payload = req.body;

  if (!githubEvent) {
    ResponseHandler.badRequest(res, HTTP_MESSAGES.MISSING_GITHUB_EVENT);
    return;
  }

  try {
    const storageService = new StorageService();

    await storageService.storeRawRequest(req, 'github', githubEvent, eventId);
  } catch (error) {
    logger.error('Failed to store raw request:', error);
  }

  const eventService = new EventService();

  try {
    const processor = ProcessorFactory.createProcessor(
      githubEvent,
      eventService
    );
    const event = await processor.process(payload as PushEvent, req.headers);

    if (!event) {
      ResponseHandler.success(res, HTTP_MESSAGES.DUPLICATE_EVENT);
      return;
    }

    await eventService.createEvent(event);
    logger.info('Event created successfully');
    ResponseHandler.success(res, HTTP_MESSAGES.EVENT_PROCESSED);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith('Unknown event type:')
    ) {
      logger.info(`Skipping unsupported event type: ${githubEvent}`);
      ResponseHandler.success(
        res,
        HTTP_MESSAGES.UNSUPPORTED_EVENT(githubEvent)
      );
      return;
    }

    logger.error('Failed to process event:', error);
    ResponseHandler.error(res, HTTP_MESSAGES.PROCESSING_ERROR);
  }
};
