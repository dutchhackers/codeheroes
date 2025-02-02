import { GameState } from '@codeheroes/migration-shared';
import { IPubSubEvent } from '../../core/interfaces';
import { GameService } from '../../core/services/game-service';

const gameService = new GameService();

export async function onFinishGame(message: IPubSubEvent) {
  console.log('[onFinishGame] Finish game');
  await closeCurrentGame();
}

async function closeCurrentGame() {
  // Close Running game(s)
  const runningGames = await gameService.getGames({ gameState: GameState.InProgress });
  if (runningGames.length > 0) {
    for (const game of runningGames) {
      console.log('close game ' + game.id);
      await gameService.closeGame(game.id);
    }
  }
}
