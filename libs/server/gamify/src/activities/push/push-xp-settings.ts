import { XpSettings } from '../../models/gamification.model';

export const PUSH_XP_SETTINGS: XpSettings = {
  base: 100,
  bonuses: {
    multipleCommits: {
      threshold: 2,
      xp: 50,
      description: 'Bonus for multiple commits in push',
    },
    significantChanges: {
      threshold: 100, // lines changed
      xp: 100,
      description: 'Bonus for substantial code contribution',
    },
  },
};
