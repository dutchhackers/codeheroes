import { GameAction, GameActionService } from '@codeheroes/game-core';
import { ProgressionService } from '@codeheroes/gamification';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const processGameAction = onDocumentCreated('gameActions/{actionId}', async (event) => {
  const gameAction = event.data?.data() as GameAction;
  if (!gameAction) return;

  const gameActionService = new GameActionService();
  const progressionService = new ProgressionService();

  try {
    // TO BE FIXED, LATER
    // await progressionService.processGameAction(gameAction);
    await gameActionService.markAsProcessed(gameAction.id);
  } catch (error) {
    await gameActionService.markAsFailed(gameAction.id, error.message);
    throw error;
  }
});
