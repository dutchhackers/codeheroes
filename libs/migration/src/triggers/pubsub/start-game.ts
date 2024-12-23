import { GameState } from "../../core/enums";
import { IPubSubEvent } from "../../core/interfaces";
import { IUser } from "../../core/models";
import { GameService } from "../../core/services/game-service";
import { TeamService } from "../../core/services/team-service";
import { UserService } from "../../core/services/user-service";

const teamService = new TeamService();
const gameService = new GameService();
const userService = new UserService();

export async function onStartGame(message: IPubSubEvent) {
  console.log("[onStartGame] Start new game");
  await createNewGame();
}

async function createNewGame() {
  // Delete Open games
  const openGames = await gameService.getGames({ gameState: GameState.Open });
  if (openGames.length > 0) {
    for (const game of openGames) {
      console.log("delete game " + game.id);
      await gameService.deleteGame(game.id);
    }
  }

  // Close Running game(s)
  const runningGames = await gameService.getGames({
    gameState: GameState.InProgress,
  });
  if (runningGames.length > 0) {
    for (const game of runningGames) {
      console.log("close game " + game.id);
      await gameService.closeGame(game.id);
    }
  }

  const lastGame = await gameService.getLastGame({
    gameState: GameState.Closed,
  });
  console.log("Last game " + lastGame.id);

  const newGame = await gameService.createGame();
  console.log("Created new game", newGame);

  // Create default teams
  const teams = await teamService.getTeams();
  await teamService.createTeams(newGame, teams);

  // 'kInvTMuHvZWHRxiGGZqK'
  const gamePlayers = await gameService.getTopNPlayers(lastGame.id, 4);

  const users: IUser[] = [];
  for (const player of gamePlayers) {
    try {
      // console.log('Retrieving player', player);
      const user = await userService.getUser(player.uid);
      // console.log('Retrieved user ', user);
      users.push(user);
    } catch (error) {
      console.error("Error receiving users", error);
    }
  }
  console.log(
    "List of players",
    users.map(p => p.displayName)
  );

  try {
    await gameService.createPlayers(newGame, users);
  } catch (error) {
    console.error("Error in createPlayers");
  }

  try {
    await teamService.assignPlayers(newGame, users, teams);
  } catch (error) {
    console.error("Error in createPlayers");
  }

  try {
    await gameService.startGame(newGame.id);
  } catch (error) {
    console.error("Error in createPlayers");
  }
}
