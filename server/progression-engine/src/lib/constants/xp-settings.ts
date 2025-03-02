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
  CODE_REVIEW: {
    BASE: 80,
    BONUSES: {
      DETAILED_REVIEW: 100, // For reviews with substantial comments
      MULTIPLE_FILES: 50, // For reviewing changes across multiple files
      THOROUGH_REVIEW: 150, // For reviews that include suggestions and code samples
    },
  },
};
