import { ActivityType } from '@codeheroes/activity';
import { XpSettings } from '../../models/gamification.model';

export const ISSUE_XP_SETTINGS: Record<string, XpSettings> = {
  [ActivityType.ISSUE_CREATED]: {
    base: 150,
    bonuses: {
      detailedDescription: {
        threshold: 200,
        xp: 100,
        description: 'Bonus for detailed issue description',
      },
      withLabels: {
        threshold: 2,
        xp: 50,
        description: 'Bonus for proper issue labeling',
      },
    },
  },
  [ActivityType.ISSUE_CLOSED]: {
    base: 250,
    bonuses: {
      completed: {
        xp: 100,
        description: 'Bonus for completing issue',
      },
      quickResolution: {
        timeThreshold: '24h',
        xp: 100,
        description: 'Bonus for quick issue resolution',
      },
    },
  },
  [ActivityType.ISSUE_UPDATED]: {
    base: 50,
    bonuses: {
      significantUpdate: {
        threshold: 100,
        xp: 50,
        description: 'Bonus for significant update',
      },
    },
  },
  [ActivityType.ISSUE_REOPENED]: {
    base: 50,
    bonuses: {
      withReason: {
        threshold: 50,
        xp: 50,
        description: 'Bonus for explaining reopen reason',
      },
    },
  },
};
