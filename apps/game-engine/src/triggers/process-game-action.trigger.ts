import { logger } from '@codeheroes/common';
import { createServiceRegistry } from '@codeheroes/progression-engine';
import { GameAction } from '@codeheroes/types';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const processGameAction = onDocumentCreated('gameActions/{actionId}', async (event) => {
  const gameAction = event.data?.data() as GameAction;
  if (!gameAction) return;

  try {
    // Create services using the registry
    const services = createServiceRegistry();

    // Use the progression service directly
    logger.info(`Processing game action: ${gameAction.id} of type ${gameAction.type}`);

    await services.progressionService.processGameAction(gameAction);

    logger.info(`Successfully processed game action: ${gameAction.id}`);
  } catch (error) {
    logger.error(`Failed to process game action: ${gameAction.id}`, { error });
    throw error;
  }
});
