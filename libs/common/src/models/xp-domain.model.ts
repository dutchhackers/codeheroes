import { BaseDocument } from './common.model';

export interface XpBreakdownItem {
  description: string;
  xp: number;
}

export interface XpSettings {
  base: number;
  bonuses?: {
    [key: string]: number;
  };
}

export interface GameXpSettings {
  [key: string]: XpSettings;
}

export interface XpCalculationResponse {
  totalXp: number;
  breakdown: XpBreakdownItem[];
}

export interface XpHistoryEntry extends BaseDocument {
  xpChange: number;
  newXp: number;
  newLevel: number;
  activityId: string;
  activityType: string;
  breakdown: XpBreakdownItem[];
}

export interface LevelCalculationResult {
  level: number;
  xpToNextLevel: number;
}

export interface UserXpData {
  xp: number;
  level: number;
  xpToNextLevel: number;
}

export const DEFAULT_XP_SETTINGS: GameXpSettings = {
  'github.push': {
    base: 10,
    bonuses: {
      multipleCommits: 5
    }
  },
  'github.pull_request.opened': {
    base: 20
  },
  'github.pull_request.closed': {
    base: 30,
    bonuses: {
      merged: 20
    }
  },
  'github.issue.opened': {
    base: 15
  },
  'github.issue.closed': {
    base: 20
  }
};
