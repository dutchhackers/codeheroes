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

export enum BadgeCategory {
  LEVEL = 'level',
  MILESTONE = 'milestone',
  SPECIAL = 'special',
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

/**
 * Badge as stored in Firestore (users/{id}/badges/{badgeId})
 */
export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageUrl?: string;
  rarity: BadgeRarity;
  category: BadgeCategory | string;
  earnedAt: string;
  metadata?: Record<string, unknown>;
}
