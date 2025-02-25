import { GameActionService } from '@codeheroes/game-core';
import { ProgressionService } from '@codeheroes/gamification';
import { GameAction } from '@codeheroes/shared/types';
import { GameAction as OldGameAction } from '@codeheroes/gamification';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

function transformToOldGameAction(newAction: GameAction): OldGameAction {
  return {
    userId: newAction.userId,
    actionType: newAction.type,
    metadata: {
      ...newAction.context,
      ...newAction.metrics,
      externalId: newAction.externalId,
      provider: newAction.provider,
      externalUser: newAction.externalUser,
      timestamp: newAction.timestamp,
    },
  };
}

export const processGameAction = onDocumentCreated('gameActions/{actionId}', async (event) => {
  const gameAction = event.data?.data() as GameAction;
  if (!gameAction) return;

  const gameActionService = new GameActionService();
  const progressionService = new ProgressionService();

  try {
    const oldGameAction = transformToOldGameAction(gameAction);
    await progressionService.processGameAction(oldGameAction);
    await gameActionService.markAsProcessed(gameAction.id);
  } catch (error) {
    await gameActionService.markAsFailed(gameAction.id, error.message);
    throw error;
  }
});
