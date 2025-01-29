import { XpSettings } from '../../models/gamification.model';

export const PUSH_XP_SETTINGS: XpSettings = {
  base: 26,
  bonuses: {
    multipleCommits: {
      threshold: 2,
      xp: 15,
      description: 'Bonus for multiple commits in push',
    },
  },
};
