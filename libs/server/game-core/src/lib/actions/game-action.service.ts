import { DatabaseInstance, DatabaseService, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { Firestore } from 'firebase-admin/firestore';
import { GameAction } from './interfaces/game-action.interface';
import { GitHubMapper } from './mappers/github.mapper';
import { GameActionContext } from './interfaces/context.interface';

export class GameActionService {
  private readonly db: Firestore;
  private readonly databaseService: DatabaseService;
  private readonly collection = 'gameActions';

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

      // Check if the action was skipped with a reason
      if ('skipReason' in actionData) {
        logger.info('Event skipped for game action creation', {
          eventType: event.source.event,
          provider: event.provider,
          reason: actionData.skipReason,
          externalId: event.source.id,
        });
        return null;
      }

      // Create and store the game action
      const gameAction = await this.create(actionData);

      logger.info('Created game action', {
        id: gameAction.id,
        type: gameAction.type,
        context: gameAction.context,
      });

      return gameAction;
    } catch (error) {
      logger.error('Failed to create game action', error);
      throw error;
    }
  }

  private async create(data: Partial<GameAction>): Promise<GameAction> {
    const docRef = this.db.collection(this.collection).doc();
    const now = getCurrentTimeAsISO();

    const gameAction: GameAction = {
      id: docRef.id,
      ...(data as Omit<GameAction, 'id' | 'status' | 'createdAt' | 'updatedAt'>),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(gameAction);
    return gameAction;
  }

  async markAsProcessed(id: string): Promise<void> {
    await this.db.collection(this.collection).doc(id).update({
      status: 'processed',
      processedAt: getCurrentTimeAsISO(),
      updatedAt: getCurrentTimeAsISO(),
    });
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    await this.db.collection(this.collection).doc(id).update({
      status: 'failed',
      error,
      updatedAt: getCurrentTimeAsISO(),
    });
  }

  async findByExternalId(externalId: string): Promise<GameAction | null> {
    const snapshot = await this.db.collection(this.collection).where('externalId', '==', externalId).limit(1).get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as GameAction;
  }

  async findRecentByUser(userId: string, limit = 10): Promise<GameAction[]> {
    const snapshot = await this.db
      .collection(this.collection)
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as GameAction);
  }

  async findByContext<T extends GameActionContext>(
    contextType: T['type'],
    contextFilter: Partial<T>,
  ): Promise<GameAction[]> {
    let query = this.db.collection(this.collection).where('context.type', '==', contextType);

    // Add filters for each provided context field
    Object.entries(contextFilter).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.where(`context.${key}`, '==', value);
      }
    });

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as GameAction);
  }
}
