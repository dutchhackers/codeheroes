import { ActivityType } from '@codeheroes/common';
import { XpSettings } from '../../models/gamification.model';

export const PR_REVIEW_XP_SETTINGS: Record<string, XpSettings> = {
  [ActivityType.PR_REVIEW_SUBMITTED]: {
    base: 40,
    bonuses: {
      approved: {
        xp: 20,
        description: 'Bonus for approving PR',
      },
      changesRequested: {
        xp: 30,
        description: 'Bonus for detailed review with change requests',
      },
      inDepthReview: {
        threshold: 200, // character count in review body
        xp: 25,
        description: 'Bonus for in-depth review comments',
      },
    },
  },
  [ActivityType.PR_REVIEW_UPDATED]: {
    base: 15,
    bonuses: {
      quickUpdate: {
        timeThreshold: '1h',
        xp: 10,
        description: 'Bonus for quick review update',
      },
      significantUpdate: {
        threshold: 100, // characters added/modified
        xp: 15,
        description: 'Bonus for significant review update',
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
    base: 25,
    bonuses: {
      quickResolution: {
        timeThreshold: '4h',
        xp: 15,
        description: 'Bonus for quick thread resolution',
      },
      withSummary: {
        threshold: 50, // character count
        xp: 10,
        description: 'Bonus for resolution summary',
      },
    },
  },
  [ActivityType.PR_REVIEW_THREAD_UNRESOLVED]: {
    base: 10,
    bonuses: {
      withExplanation: {
        threshold: 50,
        xp: 5,
        description: 'Bonus for explaining why thread was unresolved',
      },
    },
  },
  [ActivityType.PR_REVIEW_COMMENT_CREATED]: {
    base: 20,
    bonuses: {
      detailed: {
        threshold: 100, // characters
        xp: 15,
        description: 'Bonus for detailed comment',
      },
      inThread: {
        xp: 10,
        description: 'Bonus for participating in discussion thread',
      },
    },
  },
  [ActivityType.PR_REVIEW_COMMENT_UPDATED]: {
    base: 10,
    bonuses: {
      significant: {
        threshold: 50, // characters added
        xp: 5,
        description: 'Bonus for significant comment update',
      },
    },
  },
};
