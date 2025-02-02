import * as admin from 'firebase-admin';

import { CoreService } from './abstract-service';
import { UserService } from './user-service';

export interface IScoreCard {
  coins: number;
  xp: number;
}

export interface IPlayerStateManager {
  incrementXp(value: number): Promise<IScoreCard>;
}

export class PlayerStateManager extends CoreService implements IPlayerStateManager {
  constructor(private playerId: string) {
    super();
  }

  async incrementXp(value = 1): Promise<IScoreCard> {
    return this._saveState({ incrementXp: value });
  }

  async _saveState(args: any): Promise<IScoreCard> {
    const { incrementXp } = args;

    const incrementXpValue = admin.firestore.FieldValue.increment(incrementXp);
    const incrementScoreValue = admin.firestore.FieldValue.increment(1); // Always add 1 (for now)

    const playerRef = UserService.getUserRef(this.db, this.playerId);

    const batch = this.db.batch();
    batch.set(playerRef, { xp: incrementXpValue, score: incrementScoreValue }, { merge: true });

    await batch.commit();

    // Done. Now return updated player scorecard
    const playerDoc = await playerRef.get();
    const current = playerDoc.data();

    const scoreCard = <IScoreCard>{
      xp: current.xp,
      coins: current.score,
    };

    return Promise.resolve(scoreCard);
  }
}
