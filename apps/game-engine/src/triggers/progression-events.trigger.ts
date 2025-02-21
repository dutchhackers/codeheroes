import { ProgressionEventHandlerService } from '@codeheroes/gamification';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { logger } from '@codeheroes/common';

export const onLevelUp = onMessagePublished('progression-events', async (event) => {
  logger.info('Received progression event', {
    eventType: event.data.message.json.type,
    data: event.data.message.json,
  });

  const eventHandler = new ProgressionEventHandlerService();
  const progressionEvent = event.data.message.json;
  if (progressionEvent.type !== 'progression.level.up') {
    logger.info('Skipping non-level-up event');
    return;
  }

  logger.info('Processing level up event', { userId: progressionEvent.userId });
  await eventHandler.handleLevelUp(progressionEvent);
  logger.info('Level up event processed successfully');
});

export const onStreakUpdated = onMessagePublished('progression-events', async (event) => {
  const eventHandler = new ProgressionEventHandlerService();
  const progressionEvent = event.data.message.json;
  if (progressionEvent.type !== 'progression.streak.updated') return;
  await eventHandler.handleStreakUpdate(progressionEvent);
});

export const onBadgeEarned = onMessagePublished('progression-events', async (event) => {
  const eventHandler = new ProgressionEventHandlerService();
  const progressionEvent = event.data.message.json;
  if (progressionEvent.type !== 'progression.badge.earned') return;
  await eventHandler.handleBadgeEarned(progressionEvent);
});
