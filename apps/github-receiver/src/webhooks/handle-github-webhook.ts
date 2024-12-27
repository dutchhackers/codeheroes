import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { Activity, activityConverter, ActivityType, userConverter, XpBreakdownItem } from '../models';

export const handleGitHubWebhook = async (req, res) => {
  console.log('handleGitHubWebhook');
  const githubEvent = req.headers['x-github-event'];
  const eventId = req.headers['x-github-delivery'] as string;
  const payload = req.body;

  if (githubEvent !== 'push') {
    return res.status(200).send('Not a push event, skipping.');
  }

  const db = getFirestore();

  // // --- 1. Deduplication (using eventId) ---
  // const activityExists = await db.collectionGroup('activities')
  //   .where('eventId', '==', eventId)
  //   .limit(1)
  //   .withConverter(activityConverter)
  //   .get()
  //   .then((snapshot) => !snapshot.empty);

  // if (activityExists) {
  //   functions.logger.warn('Duplicate event, skipping.');
  //   return res.status(200).send('Duplicate event, skipping.');
  // }

  // --- 2. Extract Relevant Data from Payload ---
  const senderUsername = payload.sender.login; // GitHub username (e.g., "captaincode")
  const repositoryId = payload.repository.id;
  const repositoryName = payload.repository.full_name;
  const branch = payload.ref.replace('refs/heads/', '');
  const commits = payload.commits;

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

  // --- 4. Calculate XP and Prepare Activity Data ---
  let xpToAward = 0;
  let commitCount = 0;
  const xpBreakdown: XpBreakdownItem[] = [];

  for (const commit of commits) {
    if (commit.author.username === senderUsername) {
      xpToAward += 10; // Base XP per commit
      commitCount++;
      xpBreakdown.push({
        description: 'Base XP for Commit',
        xp: 10,
      });
    }
  }

  if (commitCount > 1) {
    xpToAward += 5;
    xpBreakdown.push({
      description: 'Bonus for multiple commits',
      xp: 5,
    });
  }

  console.log({
    xpToAward,
    commitCount,
    xpBreakdown,
  });

  // --- 5. Create Activity Document ---
  const activityId = `commit-${eventId}`;
  const activity: Activity = {
    activityId,
    authorId: userId,
    type: ActivityType.COMMIT,
    source: 'github',
    repositoryId: repositoryId.toString(),
    repositoryName,
    branch,
    eventId,
    eventTimestamp: FieldValue.serverTimestamp() as Timestamp, 
    xpAwarded: xpToAward,
    commitCount,
    userFacingDescription: `Committed ${commitCount} time(s) to ${repositoryName} (${branch}) (GitHub)`,
    xpBreakdown,
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

      // Update XP and level
      const updatedXp = user.xp + xpToAward;
      const levelUpResult = calculateLevel(
        user.level,
        user.xpToNextLevel,
        updatedXp
      );

      // Update user document
      transaction.update(userRef, {
        xp: updatedXp,
        level: levelUpResult.level,
        xpToNextLevel: levelUpResult.xpToNextLevel,
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