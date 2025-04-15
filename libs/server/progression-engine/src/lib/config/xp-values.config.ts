export const XP_VALUES = {
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
  ISSUE: {
    CREATE: {
      BASE: 80,
      BONUSES: {
        DETAILED_DESCRIPTION: 70, // For issues with detailed descriptions
        WITH_LABELS: 30, // For issues with proper labeling
      },
    },
    CLOSE: {
      BASE: 60,
      BONUSES: {
        REFERENCED_IN_PR: 50, // For issues closed via PR references
      },
    },
    REOPEN: {
      BASE: 40,
      BONUSES: {
        WITH_UPDATES: 30, // For reopening with additional information
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
