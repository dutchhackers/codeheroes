export enum BadgeType {
  ACHIEVEMENT = 'ACHIEVEMENT',
  MILESTONE = 'MILESTONE',
  SPECIAL = 'SPECIAL',
  EVENT = 'EVENT',
}

export enum BadgeRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export interface Badge {
  id: string;
  type: BadgeType;
  rarity: BadgeRarity;
  name: string;
  description: string;
  imageUrl: string;
  criteria: {
    type: string;
    threshold: number;
    timeframe?: string;
  };
  rewards?: {
    xp?: number;
    unlocks?: string[];
  };
  metadata?: Record<string, unknown>;
}
