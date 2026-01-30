/**
 * XP Values Configuration
 *
 * All values have been multiplied by 12x to support the expanded 80-level system.
 * This makes Level 80 achievable in approximately 3 years of active development.
 *
 * Previous values (for reference):
 * - CODE_PUSH.BASE was 120, now 1440
 * - PULL_REQUEST.CREATE.BASE was 100, now 1200
 */
export const XP_VALUES = {
  CODE_PUSH: {
    BASE: 1440,
    BONUSES: {
      MULTIPLE_COMMITS: 3000,
    },
  },
  PULL_REQUEST: {
    CREATE: {
      BASE: 1200,
      BONUSES: {
        MULTIPLE_FILES: 1200,
        SIGNIFICANT_CHANGES: 2400,
      },
    },
    MERGE: {
      BASE: 1200,
      BONUSES: {
        MULTIPLE_FILES: 1200,
        SIGNIFICANT_CHANGES: 2400,
      },
    },
    CLOSE: {
      BASE: 600,
      BONUSES: {
        MULTIPLE_FILES: 600,
        SIGNIFICANT_CHANGES: 1200,
      },
    },
  },
  ISSUE: {
    CREATE: {
      BASE: 960,
      BONUSES: {
        DETAILED_DESCRIPTION: 840, // For issues with detailed descriptions
        WITH_LABELS: 360, // For issues with proper labeling
      },
    },
    CLOSE: {
      BASE: 720,
      BONUSES: {
        REFERENCED_IN_PR: 600, // For issues closed via PR references
      },
    },
    REOPEN: {
      BASE: 480,
      BONUSES: {
        WITH_UPDATES: 360, // For reopening with additional information
      },
    },
  },
  CODE_REVIEW: {
    BASE: 960,
    BONUSES: {
      DETAILED_REVIEW: 1200, // For reviews with substantial comments
      MULTIPLE_FILES: 600, // For reviewing changes across multiple files
      THOROUGH_REVIEW: 1800, // For reviews that include suggestions and code samples
    },
  },
  COMMENT: {
    BASE: 360,
    BONUSES: {
      DETAILED_COMMENT: 240, // For comments with bodyLength > 100
    },
  },
  REVIEW_COMMENT: {
    BASE: 480, // Higher than regular comments - inline code review is more valuable
    BONUSES: {
      WITH_SUGGESTION: 360, // Contains code suggestion (```suggestion block)
      DETAILED: 240, // For comments with bodyLength > 150
    },
  },
  RELEASE: {
    BASE: 2400, // High-impact milestone event
    BONUSES: {
      MAJOR_VERSION: 1800, // Semver major bump (e.g., v2.0.0)
      MINOR_VERSION: 600, // Semver minor bump (e.g., v1.1.0)
      WITH_NOTES: 360, // Has release notes body
    },
  },
  WORKFLOW: {
    SUCCESS: {
      BASE: 360, // CI success
      BONUSES: {
        DEPLOYMENT: 600, // Workflow name contains 'deploy'
      },
    },
  },
  DISCUSSION: {
    CREATE: {
      BASE: 720, // Creating a discussion
      BONUSES: {
        DETAILED: 480, // For discussions with bodyLength > 300
      },
    },
    COMMENT: {
      BASE: 360, // Commenting on a discussion
      BONUSES: {
        ACCEPTED_ANSWER: 840, // For comments marked as the accepted answer
      },
    },
  },
};
