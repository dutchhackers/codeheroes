export const XP_SETTINGS = {
  CODE_PUSH: {
    BASE: 120,
    BONUSES: {
      MULTIPLE_COMMITS: 250,
    },
  },
  PULL_REQUEST: {
    CREATE: {
      BASE: 100,
      BONUSES: {
        MULTIPLE_FILES: 100,
        SIGNIFICANT_CHANGES: 200,
      },
    },
    MERGE: {
      BASE: 100,
      BONUSES: {
        MULTIPLE_FILES: 100,
        SIGNIFICANT_CHANGES: 200,
      },
    },
    CLOSE: {
      BASE: 50,
      BONUSES: {
        MULTIPLE_FILES: 50,
        SIGNIFICANT_CHANGES: 100,
      },
    },
  },
  STREAK: {
    DAY_1: 500,
    DAY_3: 1000,
    DAY_5: 2000,
    DAY_7: 3000,
  },
};
