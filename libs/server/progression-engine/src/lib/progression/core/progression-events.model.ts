import { Activity } from '@codeheroes/types';
import { ProgressionState } from './progression-state.model';

/**
 * Types of progression events that can be published
 */
export enum ProgressionEventType {
  XP_GAINED = 'progression.xp.gained',
  LEVEL_UP = 'progression.level.up',
  BADGE_EARNED = 'progression.badge.earned',
  ACTIVITY_RECORDED = 'progression.activity.recorded',
}

/**
 * Base interface for all progression events
 */
export interface ProgressionEvent {
  /** User ID that the event relates to */
  userId: string;

  /** Timestamp when the event occurred */
  timestamp: string;

  /** Type of progression event */
  type: ProgressionEventType;

  /** Event-specific data */
  data: Record<string, any>;
}

/**
 * Event published when a user gains XP
 */
export interface XpGainedEvent extends ProgressionEvent {
  type: ProgressionEventType.XP_GAINED;
  data: {
    /** Amount of XP gained */
    xpGained: number;

    /** Activity that generated the XP */
    activity?: Activity;

    /** New progression state */
    state: ProgressionState;

    /** Previous progression state */
    previousState: ProgressionState;
  };
}

/**
 * Event published when a user levels up
 */
export interface LevelUpEvent extends ProgressionEvent {
  type: ProgressionEventType.LEVEL_UP;
  data: {
    /** Previous level */
    previousLevel: number;

    /** New level */
    newLevel: number;

    /** New progression state */
    state: ProgressionState;

    /** Rewards earned for the level-up */
    rewards?: {
      badges?: string[];
      unlocks?: string[];
    };
  };
}

/**
 * Event published when a user earns a badge
 */
export interface BadgeEarnedEvent extends ProgressionEvent {
  type: ProgressionEventType.BADGE_EARNED;
  data: {
    /** ID of the earned badge */
    badgeId: string;

    /** Name of the earned badge */
    badgeName: string;

    /** Description of the earned badge */
    badgeDescription?: string;
  };
}

/**
 * Event published when an activity is recorded
 */
export interface ActivityRecordedEvent extends ProgressionEvent {
  type: ProgressionEventType.ACTIVITY_RECORDED;
  data: {
    /** The recorded activity */
    activity: Activity;
  };
}

/**
 * Type union of all progression event interfaces
 */
export type ProgressionEventUnion = XpGainedEvent | LevelUpEvent | BadgeEarnedEvent | ActivityRecordedEvent;
