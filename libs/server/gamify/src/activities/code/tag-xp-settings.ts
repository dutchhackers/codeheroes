import { XpSettings } from '../../models/gamification.model';

export const TAG_XP_SETTINGS: XpSettings = {
  base: 10,
  bonuses: {
    creation: {
      xp: 15,
      description: 'Bonus for creating a new tag for release',
    },
    deletion: {
      xp: 10,
      description: 'Bonus for cleaning up old tags',
    },
  },
} as const;
