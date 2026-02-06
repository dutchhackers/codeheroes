import { ActivityCounters } from '@codeheroes/types';

/**
 * Represents the current progression state of a user
 */
export interface ProgressionState {
  /** Unique identifier of the progression state */
  id: string;

  /** Unique identifier of the user */
  userId: string;

  /** Total experience points earned by the user */
  xp: number;

  /** Current level of the user */
  level: number;

  /** XP earned in the current level */
  currentLevelXp: number;

  /** XP needed to reach the next level */
  xpToNextLevel: number;

  /** Date of the last user activity (YYYY-MM-DD format) */
  lastActivityDate: string | null;

  /** Counters for different activity types */
  counters: ActivityCounters;

  /** Timestamp when counters were last updated */
  countersLastUpdated: string;
}

/**
 * Parameters for updating a user's progression state
 */
export interface ProgressionUpdate {
  /** Amount of XP to add to the user's total */
  xpGained: number;

  /** Type of activity that generated the XP */
  activityType?: string;
}

/**
 * Result of a progression update operation
 */
export interface ProgressionUpdateResult {
  /** New progression state after the update */
  state: ProgressionState;

  /** Previous progression state before the update */
  previousState: ProgressionState;

  /** Whether the user leveled up during this update */
  leveledUp: boolean;
}
