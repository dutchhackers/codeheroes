import { Activity } from '@codeheroes/types';
import { PRFinalState } from '../constants/stack.constants';

/**
 * Represents a stack of related PR activities grouped together
 */
export interface ActivityStack {
  /** Unique identifier for the stack (format: repoId:prNumber) */
  id: string;
  /** Type discriminator */
  type: 'stack';
  /** The PR number for display */
  prNumber: number;
  /** The PR title from the first activity that has it */
  prTitle: string;
  /** Repository name */
  repoName: string;
  /** All activities in this stack, sorted by createdAt ascending (oldest first for timeline) */
  activities: Activity[];
  /** Total XP earned across all activities in the stack */
  totalXp: number;
  /** The final state of the PR (merged, closed, or still open) */
  finalState: PRFinalState;
  /** Timestamp of the most recent activity (for sorting) */
  lastUpdatedAt: string;
  /** Timestamp of the first activity (for timeline start) */
  firstActivityAt: string;
}

/**
 * Represents a single activity that isn't part of a stack
 */
export interface SingleActivity {
  type: 'single';
  activity: Activity;
}

/**
 * Represents a date separator between activity groups
 */
export interface DateSeparator {
  type: 'date-separator';
  date: string;
  label: string;
}

/**
 * Union type for items in the activity feed
 */
export type FeedItem = ActivityStack | SingleActivity | DateSeparator;

/**
 * Type guard to check if a feed item is a stack
 */
export function isActivityStack(item: FeedItem): item is ActivityStack {
  return item.type === 'stack';
}

/**
 * Type guard to check if a feed item is a single activity
 */
export function isSingleActivity(item: FeedItem): item is SingleActivity {
  return item.type === 'single';
}

/**
 * Type guard to check if a feed item is a date separator
 */
export function isDateSeparator(item: FeedItem): item is DateSeparator {
  return item.type === 'date-separator';
}
