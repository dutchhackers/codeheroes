import { BadgeRarity } from '@codeheroes/types';
import { MILESTONE_BADGES } from './milestone-badges.config';
import { SPECIAL_BADGES } from './special-badges.config';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji for MVP
  imageUrl?: string; // Future: custom image
  rarity: BadgeRarity;
  category: 'level' | 'milestone' | 'special';
  metadata?: {
    level?: number; // For level badges
    threshold?: number; // For milestone badges
    activityType?: string; // For milestone badges
    trigger?: string; // For special badges (e.g., 'time_early', 'time_late', 'weekend_count')
    hour?: number; // For time-based badges
  };
}

export const BADGE_CATALOG: Record<string, BadgeDefinition> = {
  // Level 1
  novice_coder: {
    id: 'novice_coder',
    name: 'Code Novice',
    description: 'Started your coding journey',
    icon: '🌱',
    rarity: BadgeRarity.COMMON,
    category: 'level',
    metadata: { level: 1 },
  },
  // Level 2
  code_initiate: {
    id: 'code_initiate',
    name: 'Code Initiate',
    description: 'Taking the first steps',
    icon: '🔰',
    rarity: BadgeRarity.COMMON,
    category: 'level',
    metadata: { level: 2 },
  },
  // Level 3
  code_apprentice: {
    id: 'code_apprentice',
    name: 'Code Apprentice',
    description: 'Learning the craft',
    icon: '📚',
    rarity: BadgeRarity.COMMON,
    category: 'level',
    metadata: { level: 3 },
  },
  // Level 4
  code_student: {
    id: 'code_student',
    name: 'Code Student',
    description: 'Dedicated to improvement',
    icon: '✏️',
    rarity: BadgeRarity.COMMON,
    category: 'level',
    metadata: { level: 4 },
  },
  // Level 5
  code_explorer: {
    id: 'code_explorer',
    name: 'Code Explorer',
    description: 'Venturing into new territories',
    icon: '🧭',
    rarity: BadgeRarity.UNCOMMON,
    category: 'level',
    metadata: { level: 5 },
  },
  // Level 6
  code_adventurer: {
    id: 'code_adventurer',
    name: 'Code Adventurer',
    description: 'Embracing the challenge',
    icon: '⚔️',
    rarity: BadgeRarity.UNCOMMON,
    category: 'level',
    metadata: { level: 6 },
  },
  // Level 7
  code_adept: {
    id: 'code_adept',
    name: 'Code Adept',
    description: 'Skilled in the art of coding',
    icon: '🎯',
    rarity: BadgeRarity.UNCOMMON,
    category: 'level',
    metadata: { level: 7 },
  },
  // Level 8
  code_enthusiast: {
    id: 'code_enthusiast',
    name: 'Code Enthusiast',
    description: 'Passionate about code',
    icon: '🔥',
    rarity: BadgeRarity.UNCOMMON,
    category: 'level',
    metadata: { level: 8 },
  },
  // Level 9
  code_practitioner: {
    id: 'code_practitioner',
    name: 'Code Practitioner',
    description: 'Putting skills into practice',
    icon: '🛠️',
    rarity: BadgeRarity.UNCOMMON,
    category: 'level',
    metadata: { level: 9 },
  },
  // Level 10
  code_hero: {
    id: 'code_hero',
    name: 'Code Hero',
    description: 'A true coding hero!',
    icon: '🦸',
    rarity: BadgeRarity.RARE,
    category: 'level',
    metadata: { level: 10 },
  },
  // Level 11
  code_warrior: {
    id: 'code_warrior',
    name: 'Code Warrior',
    description: 'Fighting bugs with honor',
    icon: '⚡',
    rarity: BadgeRarity.RARE,
    category: 'level',
    metadata: { level: 11 },
  },
  // Level 12
  code_veteran: {
    id: 'code_veteran',
    name: 'Code Veteran',
    description: 'Battle-tested developer',
    icon: '🎖️',
    rarity: BadgeRarity.RARE,
    category: 'level',
    metadata: { level: 12 },
  },
  // Level 13
  code_specialist: {
    id: 'code_specialist',
    name: 'Code Specialist',
    description: 'Expert in your domain',
    icon: '🔬',
    rarity: BadgeRarity.RARE,
    category: 'level',
    metadata: { level: 13 },
  },
  // Level 14
  code_expert: {
    id: 'code_expert',
    name: 'Code Expert',
    description: 'Mastery recognized',
    icon: '💎',
    rarity: BadgeRarity.RARE,
    category: 'level',
    metadata: { level: 14 },
  },
  // Level 15
  code_master: {
    id: 'code_master',
    name: 'Code Master',
    description: 'Master of the craft',
    icon: '👑',
    rarity: BadgeRarity.EPIC,
    category: 'level',
    metadata: { level: 15 },
  },
  // Level 16
  code_sage: {
    id: 'code_sage',
    name: 'Code Sage',
    description: 'Wisdom through experience',
    icon: '🧙',
    rarity: BadgeRarity.EPIC,
    category: 'level',
    metadata: { level: 16 },
  },
  // Level 17
  code_legend: {
    id: 'code_legend',
    name: 'Code Legend',
    description: 'Your name echoes in the halls',
    icon: '⭐',
    rarity: BadgeRarity.EPIC,
    category: 'level',
    metadata: { level: 17 },
  },
  // Level 18
  code_champion: {
    id: 'code_champion',
    name: 'Code Champion',
    description: 'Champion of clean code',
    icon: '🏅',
    rarity: BadgeRarity.EPIC,
    category: 'level',
    metadata: { level: 18 },
  },
  // Level 19
  code_oracle: {
    id: 'code_oracle',
    name: 'Code Oracle',
    description: 'Sees the patterns others miss',
    icon: '🔮',
    rarity: BadgeRarity.EPIC,
    category: 'level',
    metadata: { level: 19 },
  },
  // Level 20
  code_architect: {
    id: 'code_architect',
    name: 'Code Architect',
    description: 'Builder of systems',
    icon: '🏆',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 20 },
  },
  // Level 20 Mastery (bonus badge)
  level_20_mastery: {
    id: 'level_20_mastery',
    name: 'Level 20 Mastery',
    description: 'Achieved maximum level in the onboarding phase',
    icon: '🎓',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 20 },
  },

  // ═══════════════════════════════════════════════════════════════════
  // ALGORITHMIC LEVEL BADGES (21+)
  // Milestone badges for levels beyond the static configuration
  // ═══════════════════════════════════════════════════════════════════
  code_virtuoso: {
    id: 'code_virtuoso',
    name: 'Code Virtuoso',
    description: 'Reached level 25 - a true coding virtuoso',
    icon: '🎻',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 25 },
  },
  code_mentor: {
    id: 'code_mentor',
    name: 'Code Mentor',
    description: 'Reached level 30 - ready to guide others',
    icon: '🧑‍🏫',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 30 },
  },
  code_synthesizer: {
    id: 'code_synthesizer',
    name: 'Code Synthesizer',
    description: 'Reached level 35 - synthesizing complex systems',
    icon: '🔗',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 35 },
  },
  senior_code_hero: {
    id: 'senior_code_hero',
    name: 'Senior Code Hero',
    description: 'Reached level 40 - senior hero status achieved',
    icon: '🦸‍♂️',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 40 },
  },
  principal_coder: {
    id: 'principal_coder',
    name: 'Principal Coder',
    description: 'Reached level 45 - principal level expertise',
    icon: '👔',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 45 },
  },
  code_luminary: {
    id: 'code_luminary',
    name: 'Code Luminary',
    description: 'Reached level 50 - a shining light in code',
    icon: '✨',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 50 },
  },
  distinguished_developer: {
    id: 'distinguished_developer',
    name: 'Distinguished Developer',
    description: 'Reached level 55 - distinguished among peers',
    icon: '🎩',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 55 },
  },
  code_visionary: {
    id: 'code_visionary',
    name: 'Code Visionary',
    description: 'Reached level 60 - seeing the future of code',
    icon: '🔭',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 60 },
  },
  code_titan: {
    id: 'code_titan',
    name: 'Code Titan',
    description: 'Reached level 65 - a titan of technology',
    icon: '🗿',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 65 },
  },
  code_deity: {
    id: 'code_deity',
    name: 'Code Deity',
    description: 'Reached level 70 - divine coding powers',
    icon: '⚡',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 70 },
  },
  code_immortal: {
    id: 'code_immortal',
    name: 'Code Immortal',
    description: 'Reached level 75 - your code lives forever',
    icon: '♾️',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 75 },
  },
  grandmaster_coder: {
    id: 'grandmaster_coder',
    name: 'Grandmaster Coder',
    description: 'Reached level 80 - ultimate grandmaster status',
    icon: '👑',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 80 },
  },

  // Merge in milestone badges
  ...MILESTONE_BADGES,
  // Merge in special badges
  ...SPECIAL_BADGES,
};

/**
 * Get a badge definition by ID
 */
export function getBadgeDefinition(badgeId: string): BadgeDefinition | undefined {
  return BADGE_CATALOG[badgeId];
}

/**
 * Get all badges for a specific category
 */
export function getBadgesByCategory(category: BadgeDefinition['category']): BadgeDefinition[] {
  return Object.values(BADGE_CATALOG).filter((badge) => badge.category === category);
}

/**
 * Get the badge for a specific level
 */
export function getBadgeForLevel(level: number): BadgeDefinition | undefined {
  return Object.values(BADGE_CATALOG).find((badge) => badge.category === 'level' && badge.metadata?.level === level);
}
