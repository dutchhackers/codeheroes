import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { assignPlayerToTeam } from '../../helpers/assign-players';
import { Score } from '@codeheroes/migration-shared';

export class DatabaseTriggers {
  static async onScoreEvent(event): Promise<any> {
    logger.debug('Executing onScoreEvent', event);

    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data associated with the event');
      return;
    }

    const score = snapshot.data() as Score;
    const playerRef = admin.firestore().collection('games').doc(score.game).collection('players').doc(score.player);
    const userRef = admin.firestore().collection('users').doc(score.player);
    const badgeRef = admin.firestore().collection('badges');

    if (score.team === null) {
      console.log("player doesn't have team, assigning to new team");
      const newTeam = await assignPlayerToTeam(admin.firestore(), score.player, score.game);
      console.log(`[Scores] [onScore] [Player ${score.player} assigned to team]`, newTeam);
      if (newTeam) {
        score.team = newTeam.id;
      }
    }

    //Score Transactions
    if (score.team) {
      await admin.firestore().runTransaction(async (transaction) => {
        const teamRef = admin.firestore().collection('games').doc(score.game).collection('teams').doc(score.team);
        const teamDoc = await transaction.get(teamRef);
        if (teamDoc.exists) {
          const newScore = (teamDoc.data().score || 0) + score.score;
          await transaction.update(teamRef, { score: newScore });
        }
      });
    }

    await admin.firestore().runTransaction(async (transaction) => {
      const playerDoc = await transaction.get(playerRef);
      if (playerDoc.exists) {
        const newScore = (playerDoc.data().score || 0) + score.score;
        await transaction.update(playerRef, { score: newScore });
      }
    });

    await admin.firestore().runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (userDoc.exists) {
        const newScore = (userDoc.data().score || 0) + score.score;
        await transaction.update(userRef, { score: newScore });
      } else {
        console.log('UserDoc not found');
      }
    });

    //Badge Transactions
    const player = await userRef.get();
    if (player.exists) {
      const user = player.data();
      let badge;
      let badgeId;
      await badgeRef
        .where('event_ref', '==', score.eventType)
        .get()
        .then((snapshot) => {
          snapshot.forEach((doc) => {
            badge = doc.data();
            badgeId = doc.id;
          });
        })
        .catch((err) => {
          return null;
        });
      if (badgeId) {
        const activityRef = admin.firestore().collection('activities').doc();
        const userBadgeRef = userRef.collection('badges').doc(badgeId);
        await admin.firestore().runTransaction(async (transaction) => {
          const userBadgeDoc = await transaction.get(userBadgeRef);
          if (!userBadgeDoc.exists) {
            console.log('Started progressing to a new rank');
            await transaction.set(userBadgeRef, {
              avatar_ref: badge.avatar_ref,
              badge_id: badgeId,
              badge_name: badge.badge_name,
              description: badge.description,
              event_occ: 1,
              rank: 0,
            });
          } else if (userBadgeDoc.exists) {
            console.log('Incremented event occurence');
            const nextOccurence = userBadgeDoc.data().event_occ + 1;
            await transaction.update(userBadgeRef, { event_occ: nextOccurence });

            const nextRankId = userBadgeDoc.data().rank;
            const newOccurence = nextOccurence;
            const nextRankRef = badgeRef.doc(badgeId);
            const nextRankDoc = await nextRankRef.get();
            if (nextRankDoc.exists) {
              const nextRank = nextRankDoc.data();
              if (nextRank.ranks[nextRankId] !== undefined) {
                const neededOcc = nextRank.ranks[nextRankId].needed_occ;
                if (newOccurence >= neededOcc) {
                  const newRank = nextRankId + 1;
                  console.log('updating badge rank');
                  await transaction.update(userBadgeRef, { rank: newRank });
                  await transaction.set(activityRef, {
                    eventType: 'badge-events',
                    game: score.game,
                    message: null,
                    user: user.email,
                    repo: null,
                    id: badge.badge_id,
                    photoUrl: user.photoUrl,
                    timestamp: score.time,
                    eventData: {
                      badge_name: badge.badge_name,
                      badge_avatar: badge.avatar_ref,
                      event_occ: newOccurence,
                      new_rank: newRank,
                      description: badge.description,
                    },
                  });
                } else {
                  console.log('already at max rank');
                }
              }
            }
          }
        });
      }
    }
  }
}
