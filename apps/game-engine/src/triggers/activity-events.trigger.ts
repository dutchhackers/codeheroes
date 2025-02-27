import { UnifiedEventHandlerService } from '@codeheroes/gamification';
import { ProgressionEventType } from '@codeheroes/shared/types';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';

export const onActivityRecorded = onMessagePublished('progression-events', async (event) => {
  const eventHandler = new UnifiedEventHandlerService();
  const progressionEvent = event.data.message.json;
  if (progressionEvent.type !== ProgressionEventType.ACTIVITY_RECORDED) return;
  await eventHandler.handleEvent(progressionEvent);
});
