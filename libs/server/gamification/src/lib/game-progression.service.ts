import { DatabaseInstance, logger } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { Firestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { ActionHandlerFactory } from './factories/action-handler.factory';
import { EventService } from './events/event.service';
import { ActionResult, GameAction } from './core/interfaces/action';

export class GameProgressionService {
  private db: Firestore;
  private eventService: EventService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    ActionHandlerFactory.initialize(this.db);
    this.eventService = new EventService();
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
      return await this.eventService.handleNewEvent(event);
    } catch (error) {
      logger.error('Error handling event:', error);
      return null;
    }
  }
}
