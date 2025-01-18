import { FirestoreCollections } from '../core/enums';

export async function assignPlayerToTeam(
  db: FirebaseFirestore.Firestore,
  userId: string,
  gameId: string
): Promise<any> {
  try {
    const gameDoc = await db.collection(FirestoreCollections.GAMES).doc(gameId).get();
    const game = gameDoc.data();
    if (game.status === 'CLOSED') {
      console.log('Cannot add players to a closed game');
      return null;
    }

    const userDoc = await db.collection(FirestoreCollections.USERS).doc(userId).get();
    if (!userDoc.exists) {
      console.log('User not found', userId, gameId);
      return null;
    }
    const user = userDoc.data();

    const gameTeamsCollection = await gameDoc.ref.collection('teams').get();

    let minPlayerCount = 1000;
    const teams = [];
    for (const doc of gameTeamsCollection.docs) {
      const teamItem = doc.data();
      // TODO: move next code/conditions to somem transactional function
      teamItem.memberCount = (await doc.ref.collection('members').get()).size;
      teams.push(teamItem);

      if (teamItem.memberCount < minPlayerCount) {
        minPlayerCount = teamItem.memberCount;
      }
    }

    const pool = teams.filter((p) => p.memberCount === minPlayerCount);
    const team = pool[Math.ceil(Math.random() * pool.length - 1)];
    console.log('Should add player ' + user.displayName + ' to team: ' + team.name);

    const player = {
      displayName: user.displayName,
      teamID: team.id,
      avatar: user.photoUrl,
    };

    const playerRef = gameDoc.ref.collection('players').doc(userDoc.id);
    const teamMemberRef = gameDoc.ref.collection('teams').doc(team.id).collection('members').doc(userDoc.id);
    const activityRef = db.collection('activities').doc();

    await db.runTransaction(async (t) => {
      const doc = await t.get(playerRef);
      if (doc.exists) {
        console.log('Player already exists in game', doc.data());
        return null;
      }

      // Add player to players collection
      await t.set(playerRef, { ...player, ...{ score: 0 } }, { merge: true });

      // Add player to team-member collection
      await t.set(teamMemberRef, player);

      //TODO: move code to separate trigger? 'On Player Joined subscription?'
      await t.set(activityRef, {
        eventType: 'player-events',
        game: gameId,
        id: null,
        message: null,
        photoUrl: user.photoUrl,
        repo: null,
        timestamp: new Date().toISOString(),
        user: user.email,
        eventData: {
          action: 'joined',
          team: team.name,
          avatar: team.avatar,
        },
      });

      return team;
    });

    return null;
  } catch (error) {
    console.error(error);
  }
}
