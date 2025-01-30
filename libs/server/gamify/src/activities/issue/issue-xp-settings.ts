import { ActivityType } from '@codeheroes/common';
import { XpSettings } from '../../models/gamification.model';

export const ISSUE_XP_SETTINGS: Record<string, XpSettings> = {
  [ActivityType.ISSUE_CREATED]: {
    base: 30,
    bonuses: {
      detailedDescription: {
        threshold: 200, // character count
        xp: 15,
        description: 'Bonus for detailed issue description',
      },
      withLabels: {
        threshold: 2,
        xp: 10,
        description: 'Bonus for proper issue labeling',
      },
    },
  },
  [ActivityType.ISSUE_CLOSED]: {
    base: 40,
    bonuses: {
      completed: {
        xp: 20,
        description: 'Bonus for completing issue',
      },
      quickResolution: {
        timeThreshold: '24h',
        xp: 15,
        description: 'Bonus for quick issue resolution',
      },
    },
  },
  [ActivityType.ISSUE_UPDATED]: {
    base: 10,
    bonuses: {
      significantUpdate: {
        threshold: 100, // character count
        xp: 10,
        description: 'Bonus for significant update',
      },
    },
  },
  [ActivityType.ISSUE_REOPENED]: {
    base: 5,
    bonuses: {
      withReason: {
        threshold: 50, // character count
        xp: 10,
        description: 'Bonus for explaining reopen reason',
      },
    },
  },
};
