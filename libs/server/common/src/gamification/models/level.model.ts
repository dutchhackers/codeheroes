export interface LevelRequirement {
  level: number;
  xpRequired: number;
  additionalRequirements?: {
    type: 'ACHIEVEMENTS' | 'TASKS' | 'BADGES';
    count: number;
    description: string;
  }[];
  rewards?: {
    type: 'BADGE' | 'POINTS' | 'FEATURE_UNLOCK';
    id: string;
    name: string;
    amount?: number;
  }[];
}

export const LEVEL_CONFIGURATION: LevelRequirement[] = [
  {
    level: 1,
    xpRequired: 0,
    rewards: [
      { type: 'BADGE', id: 'rookie_dev', name: 'Rookie Developer' }
    ]
  },
  {
    level: 2,
    xpRequired: 1000,
    rewards: [
      { type: 'FEATURE_UNLOCK', id: 'pr_creation', name: 'Pull Request Creation' }
    ]
  },
  {
    level: 3,
    xpRequired: 3000,
    additionalRequirements: [
      { 
        type: 'TASKS', 
        count: 5,
        description: 'Create 5 pull requests'
      }
    ]
  },
  // ... more levels
  {
    level: 50,
    xpRequired: 1000000,
    additionalRequirements: [
      { 
        type: 'ACHIEVEMENTS',
        count: 10,
        description: 'Earn 10 Gold Badges'
      }
    ],
    rewards: [
      { type: 'BADGE', id: 'master_dev', name: 'Master Developer' }
    ]
  }
];
