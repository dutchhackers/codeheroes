export type RewardType = 'BADGE' | 'POINTS' | 'FEATURE_UNLOCK';

export interface LevelRequirementItem {
  type: string;
  value: number;
  description: string;
}

export interface LevelReward {
  type: RewardType;
  id: string;
  name: string;
  amount?: number;
}

export interface LevelRequirement {
  requirements: LevelRequirementItem[];
  rewards?: LevelReward[];
}
