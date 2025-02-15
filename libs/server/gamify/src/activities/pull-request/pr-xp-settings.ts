export const PR_XP_SETTINGS = {
  created: {
    base: 200,
    bonuses: {
      readyForReview: {
        xp: 100,
        description: 'Bonus for marking PR as ready for review',
      },
    },
  },
  updated: {
    base: 50,
    bonuses: {
      multipleFiles: {
        threshold: 5,
        xp: 100,
        description: 'Bonus for updating multiple files',
      },
      significantChanges: {
        threshold: 100,
        xp: 150,
        description: 'Bonus for significant code changes',
      },
      quickUpdate: {
        timeThreshold: '1h',
        xp: 50,
        description: 'Bonus for quick PR iteration',
      },
    },
  },
  merged: {
    base: 500,
    bonuses: {
      largeImpact: {
        threshold: 500, // lines changed
        xp: 250,
        description: 'Bonus for large-scale changes',
      },
      quickMerge: {
        timeThreshold: '24h',
        xp: 150,
        description: 'Bonus for efficient PR completion',
      },
    },
  },
};
