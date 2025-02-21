import { ProgressionEventHandlerService } from '@codeheroes/gamification';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';

const eventHandler = new ProgressionEventHandlerService();

export const onLevelUp = onMessagePublished('progression-events', async (event) => {
  const progressionEvent = event.data.message.json;
  if (progressionEvent.type !== 'progression.level.up') return;
  await eventHandler.handleLevelUp(progressionEvent);
});

export const onStreakUpdated = onMessagePublished('progression-events', async (event) => {
  const progressionEvent = event.data.message.json;
  if (progressionEvent.type !== 'progression.streak.updated') return;
  await eventHandler.handleStreakUpdate(progressionEvent);
});

export const onBadgeEarned = onMessagePublished('progression-events', async (event) => {
  const progressionEvent = event.data.message.json;
  if (progressionEvent.type !== 'progression.badge.earned') return;
  await eventHandler.handleBadgeEarned(progressionEvent);
});
