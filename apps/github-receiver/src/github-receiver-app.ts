import {
  Activity,
  activityConverter,
  ActivityType,
  logger,
  PushEventDetails,
  userConverter
} from '@codeheroes/common';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

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

 

  // --- 5. Create Activity Document ---
  const activityId = `commit-${eventId}`;
  const activity: Activity = {
    activityId,
    type: ActivityType.COMMIT,
    source: 'github',
    repositoryId: repositoryId.toString(),
    repositoryName,
    eventId,
    eventTimestamp: new Date().toISOString(),
    userFacingDescription: `Committed ${commitCount} time(s) to ${repositoryName} (${branch}) (GitHub)`,
    details: {
      authorId: userId,
      authorExternalId: senderUsername,
      commitCount,
      branch,
    } as PushEventDetails
  };

  console.log('activity', activity);

  // --- 6. Update User and Write Activity (Transaction) ---
  const userRef = db
    .collection('users')
    .doc(userId)
    .withConverter(userConverter);
  const activityRef = db
    .collection(`users/${userId}/activities`)
    .doc(activityId)
    .withConverter(activityConverter);

  try {
    await db.runTransaction(async (transaction) => {
      // Get the current user data to calculate the new XP and level
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User document not found!');
      }
      console.log('User data:', userDoc.data());
      const user = userDoc.data()!;


      // Update user document
      transaction.update(userRef, {
        lastLogin: FieldValue.serverTimestamp() as Timestamp,
      });

      // Create activity document
      transaction.set(activityRef, activity);
    });

    console.log('Push event processed successfully.');
    res.status(200).send('Push event processed successfully.');
  } catch (error) {
    console.error('Transaction failed: ', error);
    res.status(500).send('Failed to process push event.');
  }
};

// --- Helper Functions ---
function calculateLevel(
  currentLevel: number,
  currentXpToNextLevel: number,
  updatedXp: number
): { level: number; xpToNextLevel: number } {
  let level = currentLevel;
  let xpToNextLevel = currentXpToNextLevel;

  while (updatedXp >= xpToNextLevel) {
    level++;
    updatedXp -= xpToNextLevel;
    xpToNextLevel = calculateXpToNextLevel(level); // Implement your formula to determine XP needed for each level
  }

  return { level, xpToNextLevel };
}

function calculateXpToNextLevel(level: number): number {
  return 1000 * level; // Example formula, adjust as needed
}
