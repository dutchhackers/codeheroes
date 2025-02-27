import { LevelRequirementItem } from '@codeheroes/shared/types';

export interface LevelConfig {
  level: number;
  xpRequired: number;
  requirements?: LevelRequirementItem[];
  rewards?: {
    title?: string;
    badges?: string[];
    unlocks?: string[];
  };
}

export const LEVEL_CONFIGURATION: LevelConfig[] = [
  {
    level: 0,
    xpRequired: 0,
  },
  {
    level: 1,
    xpRequired: 1000,
    rewards: {
      title: 'Code Novice',
      badges: ['novice_coder'],
    },
  },
  {
    level: 2,
    xpRequired: 2500,
    rewards: {
      title: 'Code Explorer',
      badges: ['code_explorer'],
    },
  },
  {
    level: 3,
    xpRequired: 5000,
    rewards: {
      title: 'Code Adept',
      badges: ['code_adept'],
    },
  },
  {
    level: 4,
    xpRequired: 10000,
    rewards: {
      title: 'Code Enthusiast',
      badges: ['code_enthusiast'],
    },
  },
  {
    level: 5,
    xpRequired: 20000,
    rewards: {
      title: 'Code Hero',
      badges: ['code_hero'],
    },
  },
  {
    level: 6,
    xpRequired: 35000,
    rewards: {
      title: 'Code Veteran',
      badges: ['code_veteran'],
    },
  },
  {
    level: 7,
    xpRequired: 55000,
    rewards: {
      title: 'Code Master',
      badges: ['code_master'],
    },
  },
  {
    level: 8,
    xpRequired: 80000,
    rewards: {
      title: 'Code Legend',
      badges: ['code_legend'],
    },
  },
  {
    level: 9,
    xpRequired: 110000,
    rewards: {
      title: 'Code Champion',
      badges: ['code_champion'],
    },
  },
  {
    level: 10,
    xpRequired: 150000,
    rewards: {
      title: 'Code Oracle',
      badges: ['code_oracle'],
    },
  },
];
