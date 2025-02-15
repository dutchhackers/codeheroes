import { ActivityType } from '@codeheroes/activity';
import { XpSettings } from '../../models/gamification.model';

export const PR_REVIEW_XP_SETTINGS: Record<string, XpSettings> = {
  [ActivityType.PR_REVIEW_SUBMITTED]: {
    base: 300,
    bonuses: {
      approved: {
        xp: 100,
        description: 'Bonus for approving PR',
      },
      changesRequested: {
        xp: 150,
        description: 'Bonus for detailed review with change requests',
      },
      inDepthReview: {
        threshold: 200,
        xp: 100,
        description: 'Bonus for in-depth review comments',
      },
    },
  },
  [ActivityType.PR_REVIEW_UPDATED]: {
    base: 50,
    bonuses: {
      quickUpdate: {
        timeThreshold: '1h',
        xp: 50,
        description: 'Bonus for quick review update',
      },
      significantUpdate: {
        threshold: 100,
        xp: 100,
        description: 'Bonus for substantial review improvement',
      },
    },
  },
  [ActivityType.PR_REVIEW_DISMISSED]: {
    base: 10,
    bonuses: {
      withReason: {
        threshold: 50, // character count
        xp: 5,
        description: 'Bonus for providing dismissal reason',
      },
    },
  },
  [ActivityType.PR_REVIEW_THREAD_RESOLVED]: {
    base: 100,
    bonuses: {
      quickResolution: {
        timeThreshold: '4h',
        xp: 50,
        description: 'Bonus for quick thread resolution',
      },
      withSummary: {
        threshold: 50,
        xp: 50,
        description: 'Bonus for resolution summary',
      },
    },
  },
  [ActivityType.PR_REVIEW_THREAD_UNRESOLVED]: {
    base: 50,
    bonuses: {
      withExplanation: {
        threshold: 50,
        xp: 50,
        description: 'Bonus for explaining why thread was unresolved',
      },
    },
  },
  [ActivityType.PR_REVIEW_COMMENT_CREATED]: {
    base: 50,
    bonuses: {
      detailed: {
        threshold: 100,
        xp: 50,
        description: 'Bonus for detailed comment',
      },
      inThread: {
        xp: 50,
        description: 'Bonus for participating in discussion thread',
      },
    },
  },
  [ActivityType.PR_REVIEW_COMMENT_UPDATED]: {
    base: 50,
    bonuses: {
      significant: {
        threshold: 50,
        xp: 50,
        description: 'Bonus for significant comment update',
      },
    },
  },
};
