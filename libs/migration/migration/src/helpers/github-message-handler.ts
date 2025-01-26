import * as logger from 'firebase-functions/logger';
import { IPubSubEvent } from '../core/interfaces';
import { Game } from '@codeheroes/migration-shared';
import { ActivityService } from '../core/services/activity-service';
import { GameService } from '../core/services/game-service';
import { GitHubService } from '../core/services/github-service';
import { UserService } from '../core/services/user-service';

const userService = new UserService();
const gameService = new GameService();
const githubService = new GitHubService();
const activityService = new ActivityService();

export async function githubMessageHandler(event: IPubSubEvent) {
  logger.info('githubMessageHandler', event.data.message.json);
  const activity = event.data.message.json;
  activity.timestamp = new Date().toISOString();

  //Get the game associated with the activity
  const currGame: Game = (await gameService.getCurrentGame()) || <Game>{};
  const user = await userService.getUser(activity.user);
  await activityService.setActivity(activity, user, currGame);
  await githubService.analyzeScore(activity, user, currGame);
}
