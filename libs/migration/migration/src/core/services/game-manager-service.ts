import { CoreService } from '../services/abstract-service';
import { GameService } from './game-service';
import { TeamService } from './team-service';
import { assignPlayerToTeam } from '../../helpers/assign-players';
import { TeamCharacterService } from './team-character-service';
import { Game, Team } from '../models';
import { GameState } from '../enums';
import { logger } from '../utils';

export interface IGameManagerService {
  startNewGame(options: any): Promise<Game>;
  stopCurrentGame();

  getCurrentGame(): Promise<Game>;
  joinGame(gameId: string, userId: string, options: any): Promise<Team>;
}

export class GameManagerService extends CoreService implements IGameManagerService {
  private _gameService: GameService;
  private _teamService: TeamService;
  private _teamCharacterService: TeamCharacterService;

  constructor() {
    super();

    this._gameService = new GameService();
    this._teamService = new TeamService();
    this._teamCharacterService = new TeamCharacterService();
  }

  async startNewGame(options: any = {}): Promise<Game> {
    // Run validations
    // - check for running games

    // Check options / defaults
    const teams = await this._teamService.getTeams();

    // Create Game
    const newGame = await this._gameService.createGame({});

    // Load all the characters
    const characters = await this._teamCharacterService.getCharacters();

    // Add characters to game
    const gameRef = this._gameService.db.collection('games').doc(newGame.id);
    for (const _team of teams) {
      const teamCharacters = characters.filter((p) => p.team === _team.id);
      await gameRef.set({ characters: teamCharacters }, { merge: true });
    }

    // Game Settings / Options setup
    await this._teamService.createTeams(newGame, teams);

    // Start Game
    await this._gameService.startGame(newGame.id);

    return await this._gameService.getGame(newGame.id);
  }

  async stopCurrentGame(): Promise<void> {
    const runningGames = await this._gameService.getGames({ gameState: GameState.InProgress });
    if (runningGames.length === 0) {
      logger.warn('No games running');
    } else if (runningGames.length === 1) {
      const game = runningGames[0];
      logger.debug('Closing game ' + game.id);
      await this._gameService.closeGame(game.id);
    } else if (runningGames.length > 1) {
      logger.warn('There are multiple games running, this should not happen');
      for (const game of runningGames) {
        logger.debug('Closing game ' + game.id);
        await this._gameService.closeGame(game.id);
      }
    }
  }

  async getCurrentGame(): Promise<Game> {
    const game = await this._gameService.getCurrentGame();
    return game;
  }

  async joinGame(gameId: string, userId: string, options: any): Promise<Team> {
    console.log(`joinGame(${gameId}, ${userId})`);
    return await assignPlayerToTeam(this.db, userId, gameId);
  }
}
