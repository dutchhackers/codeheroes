import { LevelRequirementItem } from '@codeheroes/types';

/**
 * Defines the configuration for each level, including XP requirements and rewards
 *
 * HYBRID SYSTEM:
 * - Levels 1-20: Static hand-tuned configuration (defined below)
 * - Levels 21-80+: Algorithmic (calculated in level-thresholds.ts)
 *
 * For levels > MAX_STATIC_LEVEL, XP is calculated in level-thresholds.ts using
 * a quadratic formula anchored at level 20's XP:
 *   XP(level) = LEVEL_20_XP + multiplier * (level - MAX_STATIC_LEVEL)²
 * The multiplier (2500) results in Level 80 requiring approximately 10,400,000 XP.
 *
 * Rebalanced (2024): Increased thresholds ~1.5-2x for levels 10+ to slow progression.
 * Target: Level 80 achievable in ~3 years of typical active development.
 */
export interface LevelDefinition {
  level: number;
  xpRequired: number;
  requirements?: LevelRequirementItem[];
  rewards?: {
    title?: string;
    badges?: string[];
    unlocks?: string[];
  };
}

/**
 * Static level definitions for levels 1-20 (onboarding phase)
 * Hand-tuned for progression with smooth transition to algorithmic levels
 *
 * Target progression times (active developer):
 * - Levels 1-9 (COMMON): 1-2 weeks
 * - Levels 10-14 (UNCOMMON): 1-2 months
 * - Levels 15-20 (RARE): 3-6 months
 */
export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  {
    level: 1,
    xpRequired: 0,
    rewards: {
      title: 'Code Novice',
      badges: ['novice_coder'],
    },
  },
  {
    level: 2,
    xpRequired: 3000,
    rewards: {
      title: 'Code Initiate',
      badges: ['code_initiate'],
    },
  },
  {
    level: 3,
    xpRequired: 7500,
    rewards: {
      title: 'Code Apprentice',
      badges: ['code_apprentice'],
    },
  },
  {
    level: 4,
    xpRequired: 15000,
    rewards: {
      title: 'Code Student',
      badges: ['code_student'],
    },
  },
  {
    level: 5,
    xpRequired: 30000,
    rewards: {
      title: 'Code Explorer',
      badges: ['code_explorer'],
    },
  },
  {
    level: 6,
    xpRequired: 50000,
    rewards: {
      title: 'Code Adventurer',
      badges: ['code_adventurer'],
    },
  },
  {
    level: 7,
    xpRequired: 80000,
    rewards: {
      title: 'Code Adept',
      badges: ['code_adept'],
    },
  },
  {
    level: 8,
    xpRequired: 115000,
    rewards: {
      title: 'Code Enthusiast',
      badges: ['code_enthusiast'],
    },
  },
  {
    level: 9,
    xpRequired: 150000,
    rewards: {
      title: 'Code Practitioner',
      badges: ['code_practitioner'],
    },
  },
  {
    level: 10,
    xpRequired: 200000,
    rewards: {
      title: 'Code Hero',
      badges: ['code_hero'],
    },
  },
  {
    level: 11,
    xpRequired: 270000,
    rewards: {
      title: 'Code Warrior',
      badges: ['code_warrior'],
    },
  },
  {
    level: 12,
    xpRequired: 350000,
    rewards: {
      title: 'Code Veteran',
      badges: ['code_veteran'],
    },
  },
  {
    level: 13,
    xpRequired: 420000,
    rewards: {
      title: 'Code Specialist',
      badges: ['code_specialist'],
    },
  },
  {
    level: 14,
    xpRequired: 500000,
    rewards: {
      title: 'Code Expert',
      badges: ['code_expert'],
    },
  },
  {
    level: 15,
    xpRequired: 600000,
    rewards: {
      title: 'Code Master',
      badges: ['code_master'],
    },
  },
  {
    level: 16,
    xpRequired: 720000,
    rewards: {
      title: 'Code Sage',
      badges: ['code_sage'],
    },
  },
  {
    level: 17,
    xpRequired: 860000,
    rewards: {
      title: 'Code Legend',
      badges: ['code_legend'],
    },
  },
  {
    level: 18,
    xpRequired: 1020000,
    rewards: {
      title: 'Code Champion',
      badges: ['code_champion'],
    },
  },
  {
    level: 19,
    xpRequired: 1200000,
    rewards: {
      title: 'Code Oracle',
      badges: ['code_oracle'],
    },
  },
  {
    level: 20,
    xpRequired: 1400000,
    rewards: {
      title: 'Code Architect',
      badges: ['code_architect', 'level_20_mastery'],
    },
  },
];

/**
 * Maximum level defined in static config.
 * Levels beyond this use the algorithmic formula.
 */
export const MAX_STATIC_LEVEL = 20;

/**
 * Algorithmic level titles for levels 21-80
 * Used by level-thresholds.ts for dynamic level generation
 */
export const ALGORITHMIC_LEVEL_TITLES: Record<number, { title: string; badge: string }> = {
  25: { title: 'Code Virtuoso', badge: 'code_virtuoso' },
  30: { title: 'Code Mentor', badge: 'code_mentor' },
  35: { title: 'Code Synthesizer', badge: 'code_synthesizer' },
  40: { title: 'Senior Code Hero', badge: 'senior_code_hero' },
  45: { title: 'Principal Coder', badge: 'principal_coder' },
  50: { title: 'Code Luminary', badge: 'code_luminary' },
  55: { title: 'Distinguished Developer', badge: 'distinguished_developer' },
  60: { title: 'Code Visionary', badge: 'code_visionary' },
  65: { title: 'Code Titan', badge: 'code_titan' },
  70: { title: 'Code Deity', badge: 'code_deity' },
  75: { title: 'Code Immortal', badge: 'code_immortal' },
  80: { title: 'Grandmaster Coder', badge: 'grandmaster_coder' },
};

/**
 * Default title for algorithmic levels without specific titles
 */
export function getDefaultAlgorithmicTitle(level: number): string {
  return `Code Hero Level ${level}`;
}
