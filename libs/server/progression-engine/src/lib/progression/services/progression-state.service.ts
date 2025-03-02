import { DatabaseInstance, logger } from '@codeheroes/common';
import { Collections, ProgressionState } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { getXpProgress } from '../../config/level-thresholds';
import { ActivityService } from '../../activities/services/activity.service';

/**
 * Service focused on retrieving and persisting user progression state
 */
export class ProgressionStateService {
  private db: Firestore;
  private activityService: ActivityService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.activityService = new ActivityService();
  }

  /**
   * Retrieves the current progression state for a user
   */
  async getProgressionState(userId: string): Promise<ProgressionState | null> {
    logger.debug('Getting progression state', { userId });

    const statsDoc = await this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Stats)
      .doc('current')
      .get();

    if (!statsDoc.exists) {
      logger.debug('No progression state found, returning null', { userId });
      return null;
    }

    const userStats = statsDoc.data()!;
    const { currentLevel, currentLevelXp, xpToNextLevel } = getXpProgress(userStats.xp || 0);

    // Get initial stats with counters
    const initialStats = await this.activityService.getActivityStats(userId);

    return {
      userId,
      xp: userStats.xp || 0,
      level: currentLevel,
      currentLevelXp,
      xpToNextLevel,
      lastActivityDate: userStats.lastActivityDate,
      counters: userStats.counters || initialStats.counters,
      countersLastUpdated: userStats.countersLastUpdated || initialStats.countersLastUpdated,
    };
  }

  /**
   * Creates or updates the progression state for a user
   */
  async updateProgressionState(state: ProgressionState): Promise<void> {
    logger.debug('Updating progression state', { userId: state.userId });

    const userRef = this.db.collection(Collections.Users).doc(state.userId);

    const statsRef = userRef.collection(Collections.Stats).doc('current');

    const updateData = {
      ...state,
      updatedAt: new Date().toISOString(),
    };

    await statsRef.set(updateData, { merge: true });
    logger.debug('Progression state updated', { userId: state.userId });
  }

  /**
   * Creates an initial progression state for a new user
   */
  async createInitialState(userId: string): Promise<ProgressionState> {
    logger.debug('Creating initial progression state', { userId });

    const initialStats = await this.activityService.getActivityStats(userId);
    const now = new Date().toISOString();

    const initialState: ProgressionState = {
      userId,
      xp: 0,
      level: 1,
      currentLevelXp: 0,
      xpToNextLevel: 1000,
      lastActivityDate: null,
      counters: initialStats.counters,
      countersLastUpdated: initialStats.countersLastUpdated,
    };

    const userRef = this.db.collection(Collections.Users).doc(userId);
    const statsRef = userRef.collection(Collections.Stats).doc('current');

    await statsRef.set({
      ...initialState,
      createdAt: now,
      updatedAt: now,
    });

    logger.debug('Initial progression state created', { userId });
    return initialState;
  }
}
