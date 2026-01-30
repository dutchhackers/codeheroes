import { BadgeRarity } from '@codeheroes/types';

/**
 * UserBadge represents a badge earned by a user, as stored in Firestore
 * at users/{userId}/badges/{badgeId}
 */
export interface UserBadge {
  id: string;
  name: string;
  description?: string;
  earnedAt?: string; // ISO timestamp
  xp?: number;
}

/**
 * Derives badge rarity from XP value
 * - common: <100 XP
 * - uncommon: 100+ XP
 * - rare: 500+ XP
 * - epic: 2000+ XP
 * - legendary: 5000+ XP
 */
export function getBadgeRarity(xp?: number): BadgeRarity {
  if (!xp || xp < 100) return BadgeRarity.COMMON;
  if (xp < 500) return BadgeRarity.UNCOMMON;
  if (xp < 2000) return BadgeRarity.RARE;
  if (xp < 5000) return BadgeRarity.EPIC;
  return BadgeRarity.LEGENDARY;
}

/**
 * Maps badge IDs to emoji icons
 */
export function getBadgeEmoji(badgeId: string): string {
  const emojiMap: Record<string, string> = {
    first_action: '🎯',
    first_push: '🚀',
    first_pr: '📝',
    first_review: '👀',
    first_merge: '🔀',
    level_5: '⭐',
    level_10: '🌟',
    level_20: '💫',
    level_50: '🏆',
    level_100: '👑',
    streak_7: '🔥',
    streak_30: '⚡',
    streak_100: '💎',
    pr_master: '🎖️',
    code_reviewer: '🔍',
    merge_machine: '⚙️',
    early_bird: '🌅',
    night_owl: '🦉',
    weekend_warrior: '🛡️',
  };

  return emojiMap[badgeId] ?? '🏅';
}

/**
 * Gets the neon color CSS variable for a badge rarity
 */
export function getBadgeRarityColor(rarity: BadgeRarity): string {
  switch (rarity) {
    case BadgeRarity.COMMON:
      return 'rgb(148, 163, 184)'; // slate-400
    case BadgeRarity.UNCOMMON:
      return 'var(--neon-green)';
    case BadgeRarity.RARE:
      return 'var(--neon-cyan)';
    case BadgeRarity.EPIC:
      return 'var(--neon-purple)';
    case BadgeRarity.LEGENDARY:
      return 'var(--neon-orange)';
    default:
      return 'rgb(148, 163, 184)';
  }
}
