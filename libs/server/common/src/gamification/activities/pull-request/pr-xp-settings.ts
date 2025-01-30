export const PR_XP_SETTINGS = {
  created: {
    base: 50,
    bonuses: {
      readyForReview: {
        xp: 15,
        description: 'Bonus for marking PR as ready for review',
      },
    },
  },
  updated: {
    base: 15,
    bonuses: {
      multipleFiles: {
        threshold: 5,
        xp: 20,
        description: 'Bonus for updating multiple files',
      },
      significantChanges: {
        threshold: 100,
        xp: 25,
        description: 'Bonus for significant code changes',
      },
      quickUpdate: {
        timeThreshold: '1h',
        xp: 10,
        description: 'Bonus for quick PR iteration',
      },
    },
  },
  merged: {
    base: 75,
    bonuses: {
      merged: {
        xp: 50,
        description: 'Bonus for merging pull request',
      },
    },
  },
};
