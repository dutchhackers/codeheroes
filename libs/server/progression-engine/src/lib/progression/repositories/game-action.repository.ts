import { DatabaseInstance, getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { GameAction, Collections } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';

/**
 * Repository for managing game actions in Firestore
 */
export class GameActionRepository {
  private db: Firestore;
  private readonly collection = Collections.GameActions;

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  /**
   * Creates a new game action
   * @param gameAction The game action to create (without ID)
   * @returns The created game action with ID
   */
  async createGameAction(
    gameAction: Omit<GameAction, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  ): Promise<GameAction> {
    logger.debug('Creating game action', {
      userId: gameAction.userId,
      type: gameAction.type,
    });

    try {
      const docRef = this.db.collection(this.collection).doc();
      const now = getCurrentTimeAsISO();

      const newGameAction: GameAction = {
        ...(gameAction as GameAction),
        id: docRef.id,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      await docRef.set(newGameAction);

      logger.debug('Game action created successfully', {
        id: newGameAction.id,
        type: newGameAction.type,
      });

      return newGameAction;
    } catch (error) {
      logger.error('Error creating game action', { error });
      throw error;
    }
  }

  /**
   * Marks a game action as processed
   * @param id Game action ID to mark as processed
   */
  async markAsProcessed(id: string): Promise<void> {
    try {
      await this.db.collection(this.collection).doc(id).update({
        status: 'processed',
        processedAt: getCurrentTimeAsISO(),
        updatedAt: getCurrentTimeAsISO(),
      });

      logger.debug('Game action marked as processed', { id });
    } catch (error) {
      logger.error('Error marking game action as processed', { id, error });
      throw error;
    }
  }

  /**
   * Marks a game action as failed
   * @param id Game action ID to mark as failed
   * @param errorMessage Error message to store
   */
  async markAsFailed(id: string, errorMessage: string): Promise<void> {
    try {
      await this.db.collection(this.collection).doc(id).update({
        status: 'failed',
        error: errorMessage,
        updatedAt: getCurrentTimeAsISO(),
      });

      logger.debug('Game action marked as failed', { id, error: errorMessage });
    } catch (error) {
      logger.error('Error marking game action as failed', { id, error });
      throw error;
    }
  }

  /**
   * Gets a game action by ID
   * @param id Game action ID to retrieve
   * @returns The game action or null if not found
   */
  async getGameAction(id: string): Promise<GameAction | null> {
    try {
      const doc = await this.db.collection(this.collection).doc(id).get();

      return doc.exists ? (doc.data() as GameAction) : null;
    } catch (error) {
      logger.error('Error getting game action', { id, error });
      throw error;
    }
  }

  /**
   * Finds pending game actions for processing
   * @param limit Maximum number of actions to return
   * @returns Array of pending game actions
   */
  async findPendingGameActions(limit = 10): Promise<GameAction[]> {
    try {
      const snapshot = await this.db
        .collection(this.collection)
        .where('status', '==', 'pending')
        .orderBy('createdAt')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as GameAction);
    } catch (error) {
      logger.error('Error finding pending game actions', { error });
      throw error;
    }
  }

  /**
   * Finds recent game actions for a user
   * @param userId User ID to find actions for
   * @param limit Maximum number of actions to return
   * @returns Array of game actions ordered by timestamp (newest first)
   */
  async findRecentByUser(userId: string, limit = 10): Promise<GameAction[]> {
    try {
      const snapshot = await this.db
        .collection(this.collection)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as GameAction);
    } catch (error) {
      logger.error('Error finding recent game actions for user', { userId, error });
      throw error;
    }
  }
}
