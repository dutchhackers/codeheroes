import { GameActionService } from '@codeheroes/game-core';
import { ProgressionService, convertSharedToLegacy } from '@codeheroes/gamification';
import { GameAction } from '@codeheroes/shared/types';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from '@codeheroes/common';

export const processGameAction = onDocumentCreated('gameActions/{actionId}', async (event) => {
  const gameAction = event.data?.data() as GameAction;
  if (!gameAction) return;

  const gameActionService = new GameActionService();
  const progressionService = new ProgressionService();

  try {
    logger.info(`Processing game action: ${gameAction.id} of type ${gameAction.type}`);

    // Convert shared GameAction to legacy format using the utility function
    const legacyGameAction = convertSharedToLegacy(gameAction);

    // Process the action with the gamification service
    await progressionService.processGameAction(legacyGameAction);
    await gameActionService.markAsProcessed(gameAction.id);

    logger.info(`Successfully processed game action: ${gameAction.id}`);
  } catch (error) {
    logger.error(`Failed to process game action: ${gameAction.id}`, { error });
    await gameActionService.markAsFailed(gameAction.id, error.message);
    throw error;
  }
});
