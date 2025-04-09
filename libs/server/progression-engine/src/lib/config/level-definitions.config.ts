import { LevelRequirementItem } from '@codeheroes/types';

/**
 * Defines the configuration for each level, including XP requirements and rewards
 * (This was previously named LEVEL_CONFIGURATION)
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
    xpRequired: 1000,
    rewards: {
      title: 'Code Explorer',
      badges: ['code_explorer'],
    },
  },
  {
    level: 3,
    xpRequired: 2500,
    rewards: {
      title: 'Code Adept',
      badges: ['code_adept'],
    },
  },
  {
    level: 4,
    xpRequired: 5000,
    rewards: {
      title: 'Code Enthusiast',
      badges: ['code_enthusiast'],
    },
  },
  {
    level: 5,
    xpRequired: 10000,
    rewards: {
      title: 'Code Hero',
      badges: ['code_hero'],
    },
  },
  {
    level: 6,
    xpRequired: 20000,
    rewards: {
      title: 'Code Veteran',
      badges: ['code_veteran'],
    },
  },
  {
    level: 7,
    xpRequired: 35000,
    rewards: {
      title: 'Code Master',
      badges: ['code_master'],
    },
  },
  {
    level: 8,
    xpRequired: 55000,
    rewards: {
      title: 'Code Legend',
      badges: ['code_legend'],
    },
  },
  {
    level: 9,
    xpRequired: 80000,
    rewards: {
      title: 'Code Champion',
      badges: ['code_champion'],
    },
  },
  {
    level: 10,
    xpRequired: 110000,
    rewards: {
      title: 'Code Oracle',
      badges: ['code_oracle'],
    },
  },
  {
    level: 11,
    xpRequired: 150000,
    rewards: {
      title: 'Code Architect',
      badges: ['code_architect_badge'],
    },
  },
  {
    level: 12,
    xpRequired: 200000,
    rewards: {
      title: 'Code Synthesizer',
      badges: ['code_synthesizer_badge'],
    },
  },
  {
    level: 13,
    xpRequired: 250000,
    rewards: {
      title: 'Code Virtuoso',
      badges: ['code_virtuoso_badge'],
    },
  },
  {
    level: 14,
    xpRequired: 300000,
    rewards: {
      title: 'Code Mentor',
      badges: ['code_mentor_badge'],
    },
  },
  {
    level: 15,
    xpRequired: 400000,
    rewards: {
      title: 'Senior Code Hero',
      badges: ['senior_code_hero_badge', 'level_15_mastery'],
    },
  },
  {
    level: 16,
    xpRequired: 500000,
    rewards: {
      title: 'Principal Coder',
      badges: ['principal_coder_badge'],
    },
  },
  {
    level: 17,
    xpRequired: 650000,
    rewards: {
      title: 'Code Luminary',
      badges: ['code_luminary_badge'],
    },
  },
  {
    level: 18,
    xpRequired: 800000,
    rewards: {
      title: 'Distinguished Developer',
      badges: ['distinguished_developer_badge'],
    },
  },
  {
    level: 19,
    xpRequired: 1000000,
    rewards: {
      title: 'Code Visionary',
      badges: ['code_visionary_badge'],
    },
  },
  {
    level: 20,
    xpRequired: 1250000,
    rewards: {
      title: 'Grandmaster Coder',
      badges: ['grandmaster_coder_badge', 'level_20_completion'],
    },
  },
];
