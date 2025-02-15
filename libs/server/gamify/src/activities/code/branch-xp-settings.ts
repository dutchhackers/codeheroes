import { XpSettings } from '../../models/gamification.model';

export const BRANCH_XP_SETTINGS: XpSettings = {
  base: 50,
  bonuses: {
    creation: {
      xp: 50,
      description: 'Bonus for creating a new development branch',
    },
    deletion: {
      xp: 50,
      description: 'Bonus for cleaning up merged branches',
    },
  },
} as const;
