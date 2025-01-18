import { IPubSubEvent } from '../../core/interfaces';
import { IExternalEvent } from '../../core/models/external-event';
import { getVisitor } from '../../core/utils/analytics-tracker';

export async function eventToGoogleAnalytics(event: IPubSubEvent) {
  console.log('[handleExternalEvent] Handle external event for Google Analytics');

  const data = event.data.message.json as IExternalEvent;
  await execute(data);
}

async function execute(data: IExternalEvent): Promise<void> {
  console.log('execute eventToAnalytics', data);
  // send analytics to Google Analytics
  const visitor = getVisitor('anonymous');

  const params: any = {};
  if (data.data) {
    if (data.data.project) {
      params.cd1 = data.data.project;
    } else {
      params.cd1 = 'unknown';
    }

    if (data.data.repo) {
      params.cd2 = data.data.repo;
    } else {
      params.cd2 = 'unknown';
    }
  }

  const eventCategory = data.source;
  const eventType = `${data.source}_${data.type}_${data.action}`;
  const eventLabel = eventType.toLowerCase();
  const eventValue = randomXp();

  visitor.event(eventCategory, eventType, eventLabel, eventValue, params).send();
}

function randomXp() {
  return Math.floor(Math.random() * 50) * 10;
}
