import { DatabaseInstance, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { GameAction, GameActionContext } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { ProviderFactory } from '../providers/provider.factory';

export class GameActionService {
  private readonly db: Firestore;
  private readonly collection = 'gameActions';

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  async generateGameActionFromWebhook(params: {
    payload: unknown;
    provider: string;
    eventType: string;
    userId: string;
  }): Promise<GameAction | null> {
    try {
      // Check if provider is supported
      if (!ProviderFactory.supportsProvider(params.provider)) {
        logger.warn(`Unsupported provider: ${params.provider}`);
        return null;
      }

      // Get provider adapter
      const providerAdapter = ProviderFactory.getProvider(params.provider);

      // Map webhook to game action using provider adapter
      const actionData = providerAdapter.mapEventToGameAction(params.eventType, params.payload, params.userId);

      if (!actionData) {
        logger.info('Webhook does not map to a game action', {
          eventType: params.eventType,
          provider: params.provider,
        });
        return null;
      }

      // Check if the action was skipped with a reason
      if ('skipReason' in actionData) {
        logger.info('Webhook skipped for game action creation', {
          eventType: params.eventType,
          provider: params.provider,
          reason: actionData.skipReason,
        });
        return null;
      }

      // Create and store the game action
      const gameAction = await this.create(actionData);

      logger.info('Created game action from webhook', {
        id: gameAction.id,
        type: gameAction.type,
        context: gameAction.context,
      });

      return gameAction;
    } catch (error) {
      logger.error('Failed to create game action from webhook', error);
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
