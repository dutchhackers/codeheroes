import { XpSettings } from '../../models/gamification.model';

export const DELETE_XP_SETTINGS: XpSettings = {
  base: 5,
  bonuses: {
    tagDeletion: {
      xp: 10,
      description: 'Bonus for deleting a tag',
    },
    branchDeletion: {
      xp: 15,
      description: 'Bonus for deleting a branch',
    },
  },
} as const;
