// import { PUB_SUB_PROJECT_ID } from "./config";
import { Publisher } from '../core/utils/publisher';
import { PublisherTopics } from '../core/utils/publisher-topics';
import { LookupService } from '../core/services/lookup-service';
import { TravisBuildEvent } from '../core/models';

const PUB_SUB_PROJECT_ID = null;

export async function travisHandler(req, res, next) {
  // console.log('headers: ' + JSON.stringify(req.headers));
  console.log('Trigger Travis event');
  console.log('body: ' + JSON.stringify(req.body));

  try {
    const payload = JSON.parse(req.body.payload);
    const travisBuildEvent = new TravisBuildEvent(payload);
    console.log('Travis Build Event', travisBuildEvent);
    await publishData(travisBuildEvent);
  } catch (error) {
    console.error('travisHandler error', error);
  }

  next();
}

async function publishData(evt: TravisBuildEvent) {
  console.log('publish travis event', evt);

  const lookupService = new LookupService();

  const employee = await lookupService.findEmployeeFromTravis({
    source: 'github',
    authorEmail: evt.authorEmail,
    authorName: evt.authorName,
  });

  console.log('Employee after lookup: ', employee);

  const activity: any = {};
  activity.id = evt.id;
  activity.timestamp = new Date().toISOString();

  activity.message = evt.message;
  activity.user = employee !== null ? employee.email : null;
  activity.repo = evt.repository.fullName;

  activity.eventType = 'travis-events';
  activity.eventData = {
    ...evt,
    repo: evt.repository.name,
    // event: "pull_request",
    // action: evt.action
  };

  const publisher = new Publisher(PUB_SUB_PROJECT_ID);
  publisher.publish(activity, PublisherTopics.TravisEvents);
}
