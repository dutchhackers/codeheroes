import { EventService, logger } from '@codeheroes/common';
import { ProcessorFactory } from './core/factory/factory.processor';
import { PushEvent } from './core/interfaces/github.interface';

export const GitHubReceiverApp = async (req, res) => {
  const githubEvent = req.headers['x-github-event'];
  const payload = req.body;

  if (githubEvent !== 'push') {
    return res.status(200).send('Not a push event, skipping.');
  }

  const eventService = new EventService();

  try {
    const processor = ProcessorFactory.createProcessor('push', eventService);
    const event = await processor.process(payload as PushEvent, req.headers);

    if (!event) {
      return res.status(200).send('Duplicate event, skipping.');
    }

    console.log('Creating event:', event);

    await eventService.createEvent(event);
    logger.info('Event created successfully');
    return res.status(200).send('Event processed successfully');
  } catch (error) {
    logger.error('Failed to process event:', error);
    return res.status(500).send('Failed to process event');
  }
};
