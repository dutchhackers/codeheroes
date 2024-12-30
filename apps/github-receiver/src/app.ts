import { EventService, logger } from '@codeheroes/common';
import { ProcessorFactory } from './core/factory/factory.processor';
import { PushEvent } from './core/interfaces/github.interface';

export const App = async (req, res) => {
  const githubEvent = req.headers['x-github-event'];
  const payload = req.body;

  if (!githubEvent) {
    return res.status(400).send('Missing GitHub event header');
  }

  const eventService = new EventService();

  try {
    const processor = ProcessorFactory.createProcessor(githubEvent, eventService);
    const event = await processor.process(payload as PushEvent, req.headers);

    if (!event) {
      return res.status(200).send('Duplicate event, skipping.');
    }

    console.log('Creating event:', event);

    await eventService.createEvent(event);
    logger.info('Event created successfully');
    return res.status(200).send('Event processed successfully');
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unknown event type:')) {
      logger.info(`Skipping unsupported event type: ${githubEvent}`);
      return res.status(200).send(`Event type '${githubEvent}' not supported`);
    }
    
    logger.error('Failed to process event:', error);
    return res.status(500).send('Failed to process event');
  }
};
