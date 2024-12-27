import { getFirestore } from 'firebase-admin/firestore';


export const handleGitHubWebhook = async (req, res) => {
  console.log('handleGitHubWebhook');
  const githubEvent = req.headers['x-github-event'];
  const eventId = req.headers['x-github-delivery'] as string;
  const payload = req.body;

  if (githubEvent !== 'push') {
    return res.status(200).send('Not a push event, skipping.');
  }

  const db = getFirestore();

  if (req) {
    return;
  }

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
  const senderUsername = payload.sender.login; // GitHub username (e.g., "michael")
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
      .where('externalUserId', '==', senderUsername)
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

  // --- 5. Create Activity Document ---

  // --- 6. Update User and Write Activity (Transaction) ---
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
