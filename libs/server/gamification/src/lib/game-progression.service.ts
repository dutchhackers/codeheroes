import { DatabaseInstance, logger } from '@codeheroes/common';
import { Firestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { ActionHandlerFactory } from './factory/action-handler.factory';
import { ActionResult, GameAction } from './types';

export class GameProgressionService {
  private db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    ActionHandlerFactory.initialize(this.db);
  }

  async processGameAction(action: GameAction): Promise<ActionResult> {
    try {
      const handler = ActionHandlerFactory.getHandler(action.actionType);
      return await handler.handle(action);
    } catch (error) {
      logger.error(`Error processing game action: ${action.actionType}`, error);
      // TODO: replace with custom error
      throw new functions.https.HttpsError('internal', 'Failed to process game action');
    }
  }
}
