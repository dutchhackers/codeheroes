import { logger } from '@codeheroes/common';
import { GameActionService } from '@codeheroes/integrations';
import { UserProgressionService } from '@codeheroes/progression-engine';
import { GameAction } from '@codeheroes/types';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const processGameAction = onDocumentCreated('gameActions/{actionId}', async (event) => {
  const gameAction = event.data?.data() as GameAction;
  if (!gameAction) return;

  const gameActionService = new GameActionService();
  const progressionService = new UserProgressionService();

  try {
    logger.info(`Processing game action: ${gameAction.id} of type ${gameAction.type}`);

    // Process the action with the gamification service
    await progressionService.processGameAction(gameAction);
    await gameActionService.markAsProcessed(gameAction.id);

    logger.info(`Successfully processed game action: ${gameAction.id}`);
  } catch (error) {
    logger.error(`Failed to process game action: ${gameAction.id}`, { error });
    await gameActionService.markAsFailed(gameAction.id, error.message);
    throw error;
  }
});
