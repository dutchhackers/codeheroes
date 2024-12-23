import { FieldValue } from "firebase-admin/firestore";

import { FirestoreCollections, GameState } from "../enums";

import { Game, Player, IUser } from "../models";
import { CoreService } from "./abstract-service";
import { logger } from "../utils";

export interface IGameService {
  createGame(options?: any): Promise<Game>;
  startGame(gameId: string);
  closeGame(gameId: string);
  deleteGame(gameId: string);

  getCurrentGame(): Promise<Game>;
  getGame(gameId: any): Promise<Game>;
  getGames(filters?: any): Promise<Game[]>;
  getLastGame(filters?: any): Promise<Game>;
}

export class GameService extends CoreService implements IGameService {
  constructor() {
    super();
  }

  async createGame(options?: any): Promise<Game> {
    const game = {
      status: GameState.Open,
      createdAt: FieldValue.serverTimestamp(),
    };

    const doc = await this.db.collection(FirestoreCollections.GAMES).add(game);
    const newDoc = await doc.get();
    const newGame = <Game>newDoc.data();
    newGame.id = doc.id;
    await doc.update({
      id: newGame.id,
    });
    return newGame;
  }

  async startGame(gameId: string): Promise<Game> {
    const doc = await this.db.collection(FirestoreCollections.GAMES).doc(gameId);
    await doc.update({
      status: GameState.InProgress,
      startedAt: FieldValue.serverTimestamp(),
    });
    const updatedGame = await doc.get();
    const startedGame = <Game>updatedGame.data();
    startedGame.id = doc.id;
    return await Promise.resolve(startedGame);
  }

  async closeGame(gameId: string) {
    const doc = await this.db.collection(FirestoreCollections.GAMES).doc(gameId);
    await doc.update({
      status: GameState.Closed,
      closedAt: FieldValue.serverTimestamp(),
    });
  }

  async deleteGame(gameId: string) {
    const doc = await this.db.collection(FirestoreCollections.GAMES).doc(gameId);
    await doc.delete();
  }

  async getGame(gameId: any): Promise<Game> {
    const doc = await this.db.collection(FirestoreCollections.GAMES).doc(gameId).get();
    if (doc !== null) {
      return <Game>doc.data();
    }
    return null;
  }

  async getGames(filters: any = {}): Promise<Game[]> {
    logger.debug("Getting games with filters", filters);

    let query: any = this.db.collection(FirestoreCollections.GAMES);
    const { gameState } = filters;

    if (gameState) {
      query = query.where("status", "==", gameState);
    }
    return this.wrapAll<Game>(await query.get());
  }

  async getLastGame(filters?: any): Promise<Game> {
    let query: any = this.db.collection(FirestoreCollections.GAMES);
    const { gameState } = filters;

    if (gameState) {
      query = query.where("status", "==", gameState);
    }
    query = query.orderBy("closedAt", "desc");

    const snapshot = await query.get();
    for (const doc of snapshot.docs) {
      return <Game>doc.data();
    }
    return null;
  }

  async getCurrentGame(): Promise<Game> {
    const gamesRef = this.db.collection(FirestoreCollections.GAMES);
    const snapshot = await gamesRef.where("status", "==", "IN_PROGRESS").get();
    if (snapshot.docs.length === 0) {
      return null;
    }
    return <Game>snapshot.docs[0].data();
  }

  async createPlayer(game: Game, user: IUser) {
    const gameRef = this.db.collection(FirestoreCollections.GAMES).doc(game.id);
    await gameRef.collection("players").doc(user.email).set({
      displayName: user.displayName,
      avatar: user.photoUrl,
    });
  }

  async createPlayers(game: Game, users: IUser[]): Promise<void> {
    if (game === null || game.id === null) {
      console.log("game is null");
    }

    const gameRef = this.db.collection(FirestoreCollections.GAMES).doc(game.id);

    for (const user of users) {
      try {
        console.log("Log user and game", game, user);
        const data = {
          displayName: user.displayName,
          avatar: user.photoUrl,
        };
        console.log("data", data);

        await gameRef.collection("players").doc(user.email).set(data);
      } catch (error) {
        console.log("Error in createPlayers", error);
      }
    }
    return Promise.resolve();
  }

  async getTopNPlayers(gameId: any, count = 10): Promise<Player[]> {
    const doc = await this.db.collection(FirestoreCollections.GAMES).doc(gameId).get();
    if (doc !== null) {
      const playersRef = doc.ref.collection("players").orderBy("score", "desc").limit(count);
      const snapshot = await playersRef.get();
      const players: Player[] = [];
      for (const item of snapshot.docs) {
        const player = <Player>item.data();
        player.uid = item.id;
        players.push(player);
      }
      return players;
    }
    return null;
  }
}
