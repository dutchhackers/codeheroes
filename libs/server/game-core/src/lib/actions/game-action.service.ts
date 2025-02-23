import { DatabaseInstance, DatabaseService, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { Firestore } from 'firebase-admin/firestore';
import { GameAction } from './interfaces';
import { GitHubMapper } from './mappers';

export class GameActionService {
  private readonly db: Firestore;
  private readonly databaseService: DatabaseService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.databaseService = new DatabaseService();
  }

  async createFromEvent(event: Event): Promise<GameAction | null> {
    try {
      // First, lookup internal user ID
      const userId = await this.databaseService.lookupUserId({
        sender: event.data?.sender,
        provider: event.provider,
      });

      if (!userId) {
        logger.warn('No matching user found for event', {
          provider: event.provider,
          externalUserId: event.data?.sender,
        });
        return null;
      }

      // Map event to game action based on provider
      let actionData: Partial<GameAction> | null = null;
      switch (event.provider) {
        case 'github':
          actionData = GitHubMapper.mapEventToGameAction(event, userId);
          break;
        // Add other providers here
      }

      if (!actionData) {
        logger.info('Event does not map to a game action', {
          eventType: event.source.event,
        });
        return null;
      }

      // Store the game action
      const docRef = this.db.collection('gameActions').doc();
      const gameAction: GameAction = {
        id: docRef.id,
        ...(actionData as Omit<GameAction, 'id' | 'status' | 'createdAt' | 'updatedAt'>),
        status: 'pending',
        createdAt: getCurrentTimeAsISO(),
        updatedAt: getCurrentTimeAsISO(),
      };

      await docRef.set(gameAction);
      return gameAction;
    } catch (error) {
      logger.error('Failed to create game action', error);
      throw error;
    }
  }

  async markAsProcessed(id: string): Promise<void> {
    await this.db.collection('gameActions').doc(id).update({
      status: 'processed',
      processedAt: getCurrentTimeAsISO(),
      updatedAt: getCurrentTimeAsISO(),
    });
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    await this.db.collection('gameActions').doc(id).update({
      status: 'failed',
      error,
      updatedAt: getCurrentTimeAsISO(),
    });
  }
}
