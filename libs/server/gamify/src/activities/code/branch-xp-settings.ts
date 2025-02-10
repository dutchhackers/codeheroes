import { XpSettings } from '../../models/gamification.model';

export const BRANCH_XP_SETTINGS: XpSettings = {
  base: 15,
  bonuses: {
    creation: {
      xp: 20,
      description: 'Bonus for creating a new development branch',
    },
    deletion: {
      xp: 15,
      description: 'Bonus for cleaning up merged branches',
    },
  },
} as const;
