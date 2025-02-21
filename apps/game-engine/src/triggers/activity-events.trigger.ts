import { ActivityEventHandlerService, ProgressionEventType } from '@codeheroes/gamification';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';

export const onActivityRecorded = onMessagePublished('progression-events', async (event) => {
  const eventHandler = new ActivityEventHandlerService();
  const progressionEvent = event.data.message.json;
  if (progressionEvent.type !== ProgressionEventType.ACTIVITY_RECORDED) return;
  await eventHandler.handleActivityRecorded(progressionEvent);
});
