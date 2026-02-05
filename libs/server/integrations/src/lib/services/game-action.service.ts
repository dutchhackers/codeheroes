import { DatabaseInstance, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { GameAction, GameActionContext } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { ProviderFactory } from '../providers/provider.factory';

// Firestore error code for ALREADY_EXISTS
const ALREADY_EXISTS_ERROR_CODE = 6;

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
    eventId?: string; // Optional eventId for deterministic ID generation
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

      // Create and store the game action with idempotency
      const gameAction = await this.createIdempotent(actionData, params.eventId);

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

  /**
   * Generates a deterministic game action ID based on event metadata.
   * This prevents duplicate game actions from being created for the same webhook event.
   *
   * @param actionType The type of game action (e.g., 'code_push', 'pull_request_create')
   * @param eventId The unique event ID from the webhook provider
   * @returns A deterministic ID string
   */
  private generateDeterministicId(actionType: string, eventId?: string): string {
    if (eventId) {
      // Use eventId for a fully deterministic ID
      return `${actionType}_${eventId}`;
    }
    // Fallback to timestamp-based ID if no eventId provided
    // This is less safe but maintains backwards compatibility
    return `${actionType}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Creates a game action with idempotency guarantees.
   * Uses Firestore's create() which atomically fails if the document already exists.
   *
   * @param data Partial game action data
   * @param eventId Optional event ID for deterministic ID generation
   * @returns The created or existing game action
   */
  private async createIdempotent(data: Partial<GameAction>, eventId?: string): Promise<GameAction> {
    const actionType = data.type || 'unknown';
    const actionId = this.generateDeterministicId(actionType, eventId);
    const docRef = this.db.collection(this.collection).doc(actionId);
    const now = getCurrentTimeAsISO();

    const gameAction: GameAction = {
      id: actionId,
      ...(data as Omit<GameAction, 'id' | 'status' | 'createdAt' | 'updatedAt'>),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    try {
      // Use create() instead of set() - this is atomic and fails if document exists
      await docRef.create(gameAction);
      return gameAction;
    } catch (error: unknown) {
      // Check if this is an ALREADY_EXISTS error
      if (this.isAlreadyExistsError(error)) {
        logger.info('Game action already exists, returning existing', { actionId });
        const existing = await docRef.get();
        if (existing.exists) {
          return existing.data() as GameAction;
        }
        // If somehow the doc doesn't exist after ALREADY_EXISTS, rethrow
        throw error;
      }
      throw error;
    }
  }

  /**
   * Checks if an error is a Firestore ALREADY_EXISTS error
   */
  private isAlreadyExistsError(error: unknown): boolean {
    return (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === ALREADY_EXISTS_ERROR_CODE
    );
  }

  /**
   * @deprecated Use createIdempotent instead for new code
   * Legacy create method for backwards compatibility
   */
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
