/**
 * XP Values Configuration
 *
 * Balanced for 80-level system with Level 80 achievable in ~3 years of active development.
 *
 * Rebalanced (2024): Reduced XP values ~50% and made bonuses harder to trigger.
 * Previous system was ~50x faster than intended due to 12x multiplier + easy bonuses.
 *
 * Target progression:
 * - Level 15: ~2 weeks of active development
 * - Level 20: ~1 month
 * - Level 80: ~3 years
 */
export const XP_VALUES = {
  CODE_PUSH: {
    BASE: 480,
    BONUSES: {
      MULTIPLE_COMMITS: 480,
    },
  },
  PULL_REQUEST: {
    CREATE: {
      BASE: 600,
      BONUSES: {
        MULTIPLE_FILES: 300,
        SIGNIFICANT_CHANGES: 600,
      },
    },
    MERGE: {
      BASE: 600,
      BONUSES: {
        MULTIPLE_FILES: 300,
        SIGNIFICANT_CHANGES: 600,
      },
    },
    CLOSE: {
      BASE: 300,
      BONUSES: {
        MULTIPLE_FILES: 150,
        SIGNIFICANT_CHANGES: 300,
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
    BASE: 800,
    BONUSES: {
      DETAILED_REVIEW: 600, // For reviews with substantial comments
      MULTIPLE_FILES: 400, // For reviewing changes across multiple files
      THOROUGH_REVIEW: 800, // For reviews that include suggestions and code samples
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
      BASE: 240, // CI success
      BONUSES: {
        DEPLOYMENT: 400, // Workflow name contains 'deploy'
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
