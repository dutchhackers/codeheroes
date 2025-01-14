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
    base: 30
  },
  'github.issue.opened': {
    base: 15
  },
  'github.issue.closed': {
    base: 20
  }
};
