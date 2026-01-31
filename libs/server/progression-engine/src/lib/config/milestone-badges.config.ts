import { BadgeRarity } from '@codeheroes/types';
import { BadgeDefinition } from './badge-catalog.config';

/**
 * Milestone thresholds for activity badges
 */
export const MILESTONE_THRESHOLDS = [1, 10, 25, 50, 100] as const;

/**
 * Activity types that have milestone badges
 */
export type MilestoneActivityType =
  | 'code_push'
  | 'pull_request_create'
  | 'pull_request_merge'
  | 'code_review_submit'
  | 'issue_create'
  | 'release_publish';

/**
 * Milestone badge definitions
 */
export const MILESTONE_BADGES: Record<string, BadgeDefinition> = {
  // ═══════════════════════════════════════════════════════════════════
  // CODE PUSH MILESTONES
  // ═══════════════════════════════════════════════════════════════════
  first_push: {
    id: 'first_push',
    name: 'First Push',
    description: 'Pushed code for the first time',
    icon: '🚀',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'code_push', threshold: 1 },
  },
  push_10: {
    id: 'push_10',
    name: 'Push Rookie',
    description: 'Pushed code 10 times',
    icon: '📤',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'code_push', threshold: 10 },
  },
  push_25: {
    id: 'push_25',
    name: 'Push Regular',
    description: 'Pushed code 25 times',
    icon: '📦',
    rarity: BadgeRarity.UNCOMMON,
    category: 'milestone',
    metadata: { activityType: 'code_push', threshold: 25 },
  },
  push_50: {
    id: 'push_50',
    name: 'Push Pro',
    description: 'Pushed code 50 times',
    icon: '🎯',
    rarity: BadgeRarity.RARE,
    category: 'milestone',
    metadata: { activityType: 'code_push', threshold: 50 },
  },
  push_100: {
    id: 'push_100',
    name: 'Push Master',
    description: 'Pushed code 100 times',
    icon: '💫',
    rarity: BadgeRarity.EPIC,
    category: 'milestone',
    metadata: { activityType: 'code_push', threshold: 100 },
  },

  // ═══════════════════════════════════════════════════════════════════
  // PULL REQUEST CREATE MILESTONES
  // ═══════════════════════════════════════════════════════════════════
  first_pr: {
    id: 'first_pr',
    name: 'First PR',
    description: 'Created your first pull request',
    icon: '🎉',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'pull_request_create', threshold: 1 },
  },
  pr_10: {
    id: 'pr_10',
    name: 'PR Contributor',
    description: 'Created 10 pull requests',
    icon: '🔀',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'pull_request_create', threshold: 10 },
  },
  pr_25: {
    id: 'pr_25',
    name: 'PR Regular',
    description: 'Created 25 pull requests',
    icon: '🔃',
    rarity: BadgeRarity.UNCOMMON,
    category: 'milestone',
    metadata: { activityType: 'pull_request_create', threshold: 25 },
  },
  pr_50: {
    id: 'pr_50',
    name: 'PR Pro',
    description: 'Created 50 pull requests',
    icon: '⚡',
    rarity: BadgeRarity.RARE,
    category: 'milestone',
    metadata: { activityType: 'pull_request_create', threshold: 50 },
  },
  pr_100: {
    id: 'pr_100',
    name: 'PR Legend',
    description: 'Created 100 pull requests',
    icon: '🏆',
    rarity: BadgeRarity.EPIC,
    category: 'milestone',
    metadata: { activityType: 'pull_request_create', threshold: 100 },
  },

  // ═══════════════════════════════════════════════════════════════════
  // PULL REQUEST MERGE MILESTONES
  // ═══════════════════════════════════════════════════════════════════
  first_merge: {
    id: 'first_merge',
    name: 'First Merge',
    description: 'Merged your first pull request',
    icon: '🎊',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'pull_request_merge', threshold: 1 },
  },
  merge_10: {
    id: 'merge_10',
    name: 'Merger',
    description: 'Merged 10 pull requests',
    icon: '🔗',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'pull_request_merge', threshold: 10 },
  },
  merge_25: {
    id: 'merge_25',
    name: 'Integration Expert',
    description: 'Merged 25 pull requests',
    icon: '🔧',
    rarity: BadgeRarity.UNCOMMON,
    category: 'milestone',
    metadata: { activityType: 'pull_request_merge', threshold: 25 },
  },
  merge_50: {
    id: 'merge_50',
    name: 'Merge Master',
    description: 'Merged 50 pull requests',
    icon: '⚙️',
    rarity: BadgeRarity.RARE,
    category: 'milestone',
    metadata: { activityType: 'pull_request_merge', threshold: 50 },
  },
  merge_100: {
    id: 'merge_100',
    name: 'Merge Legend',
    description: 'Merged 100 pull requests',
    icon: '👑',
    rarity: BadgeRarity.EPIC,
    category: 'milestone',
    metadata: { activityType: 'pull_request_merge', threshold: 100 },
  },

  // ═══════════════════════════════════════════════════════════════════
  // CODE REVIEW MILESTONES
  // ═══════════════════════════════════════════════════════════════════
  first_review: {
    id: 'first_review',
    name: 'First Review',
    description: 'Submitted your first code review',
    icon: '👀',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'code_review_submit', threshold: 1 },
  },
  review_10: {
    id: 'review_10',
    name: 'Reviewer',
    description: 'Submitted 10 code reviews',
    icon: '🔍',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'code_review_submit', threshold: 10 },
  },
  review_25: {
    id: 'review_25',
    name: 'Quality Guardian',
    description: 'Submitted 25 code reviews',
    icon: '🛡️',
    rarity: BadgeRarity.UNCOMMON,
    category: 'milestone',
    metadata: { activityType: 'code_review_submit', threshold: 25 },
  },
  review_50: {
    id: 'review_50',
    name: 'Review Expert',
    description: 'Submitted 50 code reviews',
    icon: '🎓',
    rarity: BadgeRarity.RARE,
    category: 'milestone',
    metadata: { activityType: 'code_review_submit', threshold: 50 },
  },
  review_100: {
    id: 'review_100',
    name: 'Review Master',
    description: 'Submitted 100 code reviews',
    icon: '🏅',
    rarity: BadgeRarity.EPIC,
    category: 'milestone',
    metadata: { activityType: 'code_review_submit', threshold: 100 },
  },

  // ═══════════════════════════════════════════════════════════════════
  // ISSUE MILESTONES
  // ═══════════════════════════════════════════════════════════════════
  first_issue: {
    id: 'first_issue',
    name: 'First Issue',
    description: 'Created your first issue',
    icon: '📝',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'issue_create', threshold: 1 },
  },
  issue_10: {
    id: 'issue_10',
    name: 'Issue Reporter',
    description: 'Created 10 issues',
    icon: '🐛',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'issue_create', threshold: 10 },
  },
  issue_25: {
    id: 'issue_25',
    name: 'Bug Hunter',
    description: 'Created 25 issues',
    icon: '🔎',
    rarity: BadgeRarity.UNCOMMON,
    category: 'milestone',
    metadata: { activityType: 'issue_create', threshold: 25 },
  },
  issue_50: {
    id: 'issue_50',
    name: 'Issue Expert',
    description: 'Created 50 issues',
    icon: '📋',
    rarity: BadgeRarity.RARE,
    category: 'milestone',
    metadata: { activityType: 'issue_create', threshold: 50 },
  },

  // ═══════════════════════════════════════════════════════════════════
  // RELEASE MILESTONES
  // ═══════════════════════════════════════════════════════════════════
  first_release: {
    id: 'first_release',
    name: 'First Release',
    description: 'Published your first release',
    icon: '🎁',
    rarity: BadgeRarity.UNCOMMON,
    category: 'milestone',
    metadata: { activityType: 'release_publish', threshold: 1 },
  },
  release_10: {
    id: 'release_10',
    name: 'Release Manager',
    description: 'Published 10 releases',
    icon: '📦',
    rarity: BadgeRarity.RARE,
    category: 'milestone',
    metadata: { activityType: 'release_publish', threshold: 10 },
  },
  release_25: {
    id: 'release_25',
    name: 'Release Pro',
    description: 'Published 25 releases',
    icon: '🚢',
    rarity: BadgeRarity.EPIC,
    category: 'milestone',
    metadata: { activityType: 'release_publish', threshold: 25 },
  },
};

/**
 * Get milestone badges for a specific activity type
 */
export function getMilestoneBadgesForActivity(activityType: string): BadgeDefinition[] {
  return Object.values(MILESTONE_BADGES).filter((badge) => badge.metadata?.activityType === activityType);
}

/**
 * Get the badge to award for crossing a milestone
 * Returns the badge if the new count exactly matches a threshold
 */
export function getMilestoneBadgeForCount(activityType: string, count: number): BadgeDefinition | undefined {
  return Object.values(MILESTONE_BADGES).find(
    (badge) => badge.metadata?.activityType === activityType && badge.metadata?.threshold === count
  );
}

/**
 * Get all milestone badges a user should have based on their counts
 * Useful for backfilling or verifying badges
 */
export function getAllEarnedMilestoneBadges(activityType: string, count: number): BadgeDefinition[] {
  return Object.values(MILESTONE_BADGES).filter(
    (badge) =>
      badge.metadata?.activityType === activityType &&
      badge.metadata?.threshold !== undefined &&
      count >= badge.metadata.threshold
  );
}
