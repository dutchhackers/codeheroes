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
  COMMENT: {
    BASE: 30,
    BONUSES: {
      DETAILED_COMMENT: 20, // For comments with bodyLength > 100
    },
  },
  REVIEW_COMMENT: {
    BASE: 40, // Higher than regular comments - inline code review is more valuable
    BONUSES: {
      WITH_SUGGESTION: 30, // Contains code suggestion (```suggestion block)
      DETAILED: 20, // For comments with bodyLength > 150
    },
  },
  RELEASE: {
    BASE: 200, // High-impact milestone event
    BONUSES: {
      MAJOR_VERSION: 150, // Semver major bump (e.g., v2.0.0)
      MINOR_VERSION: 50, // Semver minor bump (e.g., v1.1.0)
      WITH_NOTES: 30, // Has release notes body
    },
  },
  WORKFLOW: {
    SUCCESS: {
      BASE: 30, // CI success
      BONUSES: {
        DEPLOYMENT: 50, // Workflow name contains 'deploy'
      },
    },
  },
  DISCUSSION: {
    CREATE: {
      BASE: 60, // Creating a discussion
      BONUSES: {
        DETAILED: 40, // For discussions with bodyLength > 300
      },
    },
    COMMENT: {
      BASE: 30, // Commenting on a discussion
      BONUSES: {
        ACCEPTED_ANSWER: 70, // For comments marked as the accepted answer
      },
    },
  },
};
