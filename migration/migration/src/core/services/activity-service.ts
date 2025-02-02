import { Game, IUser } from '@codeheroes/migration-shared';
import { CoreService } from './abstract-service';
// import { Game, IUser } from "../models";

const ACTIVITY_COLLECTION = 'activities';

export interface IActivityService {
  // getCurrentGame(): Promise<Game>;
  setActivity(data: any, user: IUser, game: Game);
}

export class ActivityService extends CoreService implements IActivityService {
  constructor() {
    super();
  }

  async setActivity(activity: any, user: IUser, game: Game) {
    const activityRef = this.db.collection(ACTIVITY_COLLECTION);

    const data = {
      id: activity.id || null,
      timestamp: activity.timestamp || new Date().toISOString(),
      message: activity.message || null,
      eventType: activity.eventType || null,
      eventData: activity.eventData || null,
      user: activity.user || null,
      photoUrl: user ? user.photoUrl : null,
      repo: activity.repo || null,
      game: game.id || null,
    };
    try {
      await activityRef.doc().set(data);
    } catch (error) {
      console.log('Something went wrong:' + error);
    }
  }
}
