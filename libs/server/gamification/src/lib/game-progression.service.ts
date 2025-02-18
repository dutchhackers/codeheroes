import { DatabaseInstance, logger } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { Firestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { EventHandler } from './event-handler';
import { ActionHandlerFactory } from './factory/action-handler.factory';
import { ActionResult, GameAction } from './types';

export class GameProgressionService {
  private db: Firestore;
  private eventHandler: EventHandler;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    ActionHandlerFactory.initialize(this.db);
    this.eventHandler = new EventHandler();
  }

  async processGameAction(action: GameAction): Promise<ActionResult> {
    try {
      const handler = ActionHandlerFactory.getHandler(action.actionType);
      return await handler.handle(action);
    } catch (error) {
      logger.error(`Error processing game action: ${action.actionType}`, error);
      throw new functions.https.HttpsError('internal', 'Failed to process game action');
    }
  }

  async handleNewEvent(event: Event): Promise<GameAction | null> {
    try {
      return await this.eventHandler.handleNewEvent(event);
    } catch (error) {
      logger.error('Error handling event:', error);
      return null;
    }
  }
}
