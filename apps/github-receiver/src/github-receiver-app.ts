import {
  activityConverter,
  ActivityType,
  Event,
  EventService,
  logger,
  PushEventDetails
} from '@codeheroes/common';
import { getFirestore } from 'firebase-admin/firestore';

export const GitHubReceiverApp = async (req, res) => {
  const githubEvent = req.headers['x-github-event'];
  const eventId = req.headers['x-github-delivery'] as string;
  const payload = req.body;

  if (githubEvent !== 'push') {
    return res.status(200).send('Not a push event, skipping.');
  }

  const db = getFirestore();

  // --- 1. Deduplication (using eventId) ---
  const activityExists = await db
    .collectionGroup('activities')
    .where('eventId', '==', eventId)
    .limit(1)
    .withConverter(activityConverter)
    .get()
    .then((snapshot) => !snapshot.empty);

  if (activityExists) {
    logger.warn('Duplicate event, skipping.'); // TODO: tweak next line
    // return res.status(200).send('Duplicate event, skipping.');
  }

  // --- 2. Extract Relevant Data from Payload ---
  const senderUsername = payload.sender.login; // GitHub username (e.g., "captaincode")
  const repositoryId = payload.repository.id;
  const repositoryName = payload.repository.full_name;
  const branch = payload.ref.replace('refs/heads/', '');
  const commits = payload.commits;
  const commitCount = commits.length; // To be improved later: only count relevant

  // --- 3. Find User ID using Connected Accounts ---
  let userId: string | null = null;
  try {
    const connectedAccountSnapshot = await db
      .collectionGroup('connectedAccounts')
      .where('provider', '==', 'github')
      .where('externalUserName', '==', senderUsername)
      .limit(1)
      .get();

    if (!connectedAccountSnapshot.empty) {
      userId = connectedAccountSnapshot.docs[0].ref.parent.parent!.id;
      console.log('User ID found:', userId);
    } else {
      console.warn('User not found for GitHub username:', senderUsername);
      // Handle the case where the user is not found. You might:
      // 1. Log an error and skip processing (as shown here)
      // 2. Queue the event for later processing
      // 3. Create a provisional user (not recommended in most cases)
      return res.status(200).send('User not found, skipping.'); // Don't return an error status because GitHub will retry
    }
  } catch (error) {
    console.error('Error finding user:', error);
    return res.status(500).send('Error finding user.');
  }

  // start: 4. Create Event Document
  const eventService = new EventService();
  const event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
    activityId: `commit-${eventId}`,
    type: ActivityType.COMMIT,
    source: 'github',
    eventId,
    eventTimestamp: new Date().toISOString(),
    details: {
      authorId: userId,
      authorExternalId: senderUsername,
      repositoryId: repositoryId.toString(),
      repositoryName,
      commitCount,
      branch,
    } as PushEventDetails,
  };

  try {
    await eventService.createEvent(event);
    logger.info('Event created successfully');
  } catch (error) {
    logger.error('Failed to create event:', error);
    return res.status(500).send('Failed to create event');
  }
  // end: 4. Create Event Document
};
