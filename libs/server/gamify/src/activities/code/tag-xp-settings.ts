import { XpSettings } from '../../models/gamification.model';

export const TAG_XP_SETTINGS: XpSettings = {
  base: 75,
  bonuses: {
    creation: {
      xp: 100,
      description: 'Bonus for creating a new tag for release',
    },
    deletion: {
      xp: 50,
      description: 'Bonus for cleaning up old tags',
    },
  },
} as const;
