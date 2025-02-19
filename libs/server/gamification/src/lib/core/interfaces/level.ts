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
