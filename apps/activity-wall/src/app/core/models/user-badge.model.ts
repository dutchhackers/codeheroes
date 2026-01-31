import { BadgeRarity } from '@codeheroes/types';

/**
 * UserBadge represents a badge earned by a user, as stored in Firestore
 * at users/{userId}/badges/{badgeId}
 *
 * New structure includes icon and rarity directly from the badge catalog.
 */
export interface UserBadge {
  id: string;
  name: string;
  description?: string;
  icon?: string; // Emoji icon from badge catalog
  imageUrl?: string; // Optional image URL for future use
  rarity?: BadgeRarity; // Rarity from badge catalog
  category?: string; // 'level' | 'milestone' | 'special'
  earnedAt?: string; // ISO timestamp
  metadata?: Record<string, unknown>; // Additional badge metadata (e.g., level number)
  xp?: number; // Legacy: XP value (kept for backwards compatibility)
}

/**
 * Gets the badge rarity - uses the stored rarity if available, otherwise derives from XP
 */
export function getBadgeRarity(badge: UserBadge): BadgeRarity {
  // Prefer stored rarity from badge catalog
  if (badge.rarity) {
    return badge.rarity;
  }

  // Fallback: derive from XP for legacy badges
  const xp = badge.xp;
  if (!xp || xp < 100) return BadgeRarity.COMMON;
  if (xp < 500) return BadgeRarity.UNCOMMON;
  if (xp < 2000) return BadgeRarity.RARE;
  if (xp < 5000) return BadgeRarity.EPIC;
  return BadgeRarity.LEGENDARY;
}

/**
 * Gets the badge emoji - uses stored icon if available, otherwise maps badge ID
 */
export function getBadgeEmoji(badge: UserBadge): string {
  // Prefer stored icon from badge catalog
  if (badge.icon) {
    return badge.icon;
  }

  // Fallback: map badge ID to emoji for legacy badges
  const emojiMap: Record<string, string> = {
    // Activity milestones (legacy)
    first_action: '🎯',
    ten_actions: '🔟',
    fifty_actions: '5️⃣',
    hundred_actions: '💯',
    // Level badges (fallback if icon not stored)
    novice_coder: '🌱',
    code_initiate: '🔰',
    code_apprentice: '📚',
    code_student: '✏️',
    code_explorer: '🧭',
    code_adventurer: '⚔️',
    code_adept: '🎯',
    code_enthusiast: '🔥',
    code_practitioner: '🛠️',
    code_hero: '🦸',
    code_warrior: '⚡',
    code_veteran: '🎖️',
    code_specialist: '🔬',
    code_expert: '💎',
    code_master: '👑',
    code_sage: '🧙',
    code_legend: '⭐',
    code_champion: '🏅',
    code_oracle: '🔮',
    code_architect: '🏆',
    level_20_mastery: '🎓',
    // Other legacy badges
    first_push: '🚀',
    first_pr: '📝',
    first_review: '👀',
    first_merge: '🔀',
  };

  return emojiMap[badge.id] ?? '🏅';
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
