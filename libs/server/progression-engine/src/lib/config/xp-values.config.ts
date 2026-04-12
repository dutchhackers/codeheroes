/**
 * XP Values Configuration
 *
 * Balanced for 80-level system with Level 80 achievable in ~3 years of active development.
 *
 * Rebalanced (2026-04): Reduced XP values ~40% overall. Biggest change: CI success
 * reduced from 240 to 80 (passive XP was inflating progression 3-8x). Combined with
 * steeper level curve (multiplier 2500→3500), targets a 3-year Level 80 for power users.
 *
 * Design principles:
 * - Active > Passive: human judgment actions (reviews, issues) valued over automated events (CI)
 * - Quality > Quantity: bonuses reward depth, not volume
 * - Merge > Create: completing work is slightly more valuable than starting it
 *
 * Target progression (active developer ~10K XP/day, power user ~19K/day):
 * - Level 10: ~1 month (active dev)
 * - Level 15: ~3 months (active dev)
 * - Level 20: ~6 months (active dev)
 * - Level 80: ~3 years (power user)
 */
export const XP_VALUES = {
  CODE_PUSH: {
    BASE: 300,
    BONUSES: {
      MULTIPLE_COMMITS: 300,
    },
  },
  PULL_REQUEST: {
    CREATE: {
      BASE: 400,
      BONUSES: {
        MULTIPLE_FILES: 200,
        SIGNIFICANT_CHANGES: 400,
      },
    },
    MERGE: {
      BASE: 500,
      BONUSES: {
        MULTIPLE_FILES: 200,
        SIGNIFICANT_CHANGES: 400,
      },
    },
    CLOSE: {
      BASE: 200,
      BONUSES: {
        MULTIPLE_FILES: 100,
        SIGNIFICANT_CHANGES: 200,
      },
    },
  },
  ISSUE: {
    CREATE: {
      BASE: 600,
      BONUSES: {
        DETAILED_DESCRIPTION: 500, // For issues with detailed descriptions
        WITH_LABELS: 200, // For issues with proper labeling
      },
    },
    CLOSE: {
      BASE: 500,
      BONUSES: {
        REFERENCED_IN_PR: 400, // For issues closed via PR references
      },
    },
    REOPEN: {
      BASE: 300,
      BONUSES: {
        WITH_UPDATES: 200, // For reopening with additional information
      },
    },
  },
  CODE_REVIEW: {
    BASE: 600,
    BONUSES: {
      DETAILED_REVIEW: 400, // For reviews with substantial comments
      MULTIPLE_FILES: 300, // For reviewing changes across multiple files
      THOROUGH_REVIEW: 500, // For reviews that include suggestions and code samples
    },
  },
  COMMENT: {
    BASE: 200,
    BONUSES: {
      DETAILED_COMMENT: 150, // For comments with bodyLength > 100
    },
  },
  REVIEW_COMMENT: {
    BASE: 300, // Higher than regular comments - inline code review is more valuable
    BONUSES: {
      WITH_SUGGESTION: 250, // Contains code suggestion (```suggestion block)
      DETAILED: 150, // For comments with bodyLength > 150
    },
  },
  RELEASE: {
    BASE: 2000, // High-impact milestone event
    BONUSES: {
      MAJOR_VERSION: 1500, // Semver major bump (e.g., v2.0.0)
      MINOR_VERSION: 500, // Semver minor bump (e.g., v1.1.0)
      WITH_NOTES: 300, // Has release notes body
    },
  },
  WORKFLOW: {
    SUCCESS: {
      BASE: 80, // CI success — intentionally low, passive XP
      BONUSES: {
        DEPLOYMENT: 200, // Workflow name contains 'deploy'
      },
    },
  },
  DISCUSSION: {
    CREATE: {
      BASE: 500, // Creating a discussion
      BONUSES: {
        DETAILED: 300, // For discussions with bodyLength > 300
      },
    },
    COMMENT: {
      BASE: 250, // Commenting on a discussion
      BONUSES: {
        ACCEPTED_ANSWER: 600, // For comments marked as the accepted answer
      },
    },
  },
};
