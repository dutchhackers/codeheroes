import { UnifiedEventHandlerService } from '@codeheroes/progression-engine';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { logger } from '@codeheroes/common';
import { ProgressionEventType } from '@codeheroes/types';

export const onLevelUp = onMessagePublished('progression-events', async (event) => {
  logger.info('Received progression event', {
    eventType: event.data.message.json.type,
    data: event.data.message.json,
  });

  const eventHandler = new UnifiedEventHandlerService();
  const progressionEvent = event.data.message.json;
  if (progressionEvent.type !== ProgressionEventType.LEVEL_UP) {
    logger.info('Skipping non-level-up event');
    return;
  }

  logger.info('Processing level up event', { userId: progressionEvent.userId });
  await eventHandler.handleEvent(progressionEvent);
  logger.info('Level up event processed successfully');
});

export const onBadgeEarned = onMessagePublished('progression-events', async (event) => {
  const eventHandler = new UnifiedEventHandlerService();
  const progressionEvent = event.data.message.json;
  if (progressionEvent.type !== ProgressionEventType.BADGE_EARNED) return;
  await eventHandler.handleEvent(progressionEvent);
});
