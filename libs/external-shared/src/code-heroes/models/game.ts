import { GameState } from "../enums/game-state";

export interface Game {
  id: string;
  status: GameState;
  createdAt: Date;
  startedAt: Date;
  closedAt?: Date;
}
