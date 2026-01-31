import {
  LEVEL_DEFINITIONS,
  MAX_STATIC_LEVEL,
  ALGORITHMIC_LEVEL_TITLES,
  getDefaultAlgorithmicTitle,
  LevelDefinition,
} from './level-definitions.config';

/**
 * HYBRID LEVEL SYSTEM
 *
 * Levels 1-20: Use static LEVEL_DEFINITIONS array (hand-tuned onboarding)
 * Levels 21+: Use algorithmic formula starting from Level 20's XP threshold
 *
 * This approach:
 * - Provides carefully tuned early progression
 * - Eliminates maintenance burden for 80+ levels
 * - Supports infinite scaling without "hard cap" bugs
 * - Ensures monotonic XP progression (each level requires more XP)
 */

/**
 * XP multiplier for algorithmic levels (21+)
 * Formula: XP = LEVEL_20_XP + (ALGORITHMIC_XP_MULTIPLIER * levelsAbove20²)
 */
const ALGORITHMIC_XP_MULTIPLIER = 1500;

/**
 * XP required for Level 20 (the last static level)
 * Derived from LEVEL_DEFINITIONS to prevent drift if static thresholds are adjusted
 */
const LEVEL_20_XP =
  LEVEL_DEFINITIONS.find((c) => c.level === MAX_STATIC_LEVEL)?.xpRequired ?? 775000;

/**
 * Calculate XP required for a given level using the algorithmic formula
 * Used for levels beyond MAX_STATIC_LEVEL
 *
 * Formula: LEVEL_20_XP + (MULTIPLIER × levelsAbove20²)
 * This ensures monotonic progression from Level 20's endpoint
 *
 * Examples:
 * - Level 21: 775,000 + 1,500 × 1² = 776,500 XP
 * - Level 22: 775,000 + 1,500 × 2² = 781,000 XP
 * - Level 25: 775,000 + 1,500 × 5² = 812,500 XP
 * - Level 30: 775,000 + 1,500 × 10² = 925,000 XP
 */
function calculateAlgorithmicXp(level: number): number {
  const levelsAbove20 = level - MAX_STATIC_LEVEL;
  return LEVEL_20_XP + ALGORITHMIC_XP_MULTIPLIER * levelsAbove20 * levelsAbove20;
}

/**
 * Get XP required for a specific level
 * Uses static config for levels 1-20, algorithmic for 21+
 */
export function calculateXpForLevel(level: number): number {
  if (level <= 0) return 0;

  // Use static config for early levels
  if (level <= MAX_STATIC_LEVEL) {
    const config = LEVEL_DEFINITIONS.find((c) => c.level === level);
    return config?.xpRequired ?? 0;
  }

  // Use algorithmic formula for levels 21+
  return calculateAlgorithmicXp(level);
}

/**
 * Calculate level from total XP
 * Supports infinite scaling beyond level 80
 */
export function getLevelFromXp(totalXp: number): number {
  if (totalXp < 0) return 1;

  // Check static levels first (1-20)
  for (let i = LEVEL_DEFINITIONS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_DEFINITIONS[i].xpRequired) {
      const staticLevel = LEVEL_DEFINITIONS[i].level;

      // If at max static level, check if we've exceeded into algorithmic territory
      if (staticLevel === MAX_STATIC_LEVEL) {
        // Check if XP exceeds Level 21's threshold
        const level21Xp = calculateAlgorithmicXp(MAX_STATIC_LEVEL + 1);
        if (totalXp >= level21Xp) {
          // Inverse of: xp = LEVEL_20_XP + MULTIPLIER × levelsAbove20²
          // levelsAbove20 = sqrt((xp - LEVEL_20_XP) / MULTIPLIER)
          const levelsAbove20 = Math.floor(
            Math.sqrt((totalXp - LEVEL_20_XP) / ALGORITHMIC_XP_MULTIPLIER)
          );
          return MAX_STATIC_LEVEL + levelsAbove20;
        }
      }

      return staticLevel;
    }
  }

  return 1;
}

/**
 * Get detailed XP progress information
 */
export function getXpProgress(totalXp: number): {
  currentLevel: number;
  currentLevelXp: number;
  xpToNextLevel: number;
} {
  const currentLevel = getLevelFromXp(totalXp);
  const currentLevelXpRequired = calculateXpForLevel(currentLevel);
  const nextLevelXpRequired = calculateXpForLevel(currentLevel + 1);

  const currentLevelXp = totalXp - currentLevelXpRequired;
  const xpToNextLevel = nextLevelXpRequired - totalXp;

  return {
    currentLevel,
    currentLevelXp: Math.max(0, currentLevelXp),
    xpToNextLevel: Math.max(0, xpToNextLevel),
  };
}

/**
 * Get level requirements (rewards, title, etc.) for a specific level
 */
export function getLevelRequirements(level: number): LevelDefinition | undefined {
  // Use static config for early levels
  if (level <= MAX_STATIC_LEVEL) {
    return LEVEL_DEFINITIONS.find((config) => config.level === level);
  }

  // Generate dynamic config for algorithmic levels
  // Only milestone levels (25, 30, 35...) have badges defined in ALGORITHMIC_LEVEL_TITLES
  // Non-milestone levels return empty badges array to avoid silent failures
  const milestoneConfig = ALGORITHMIC_LEVEL_TITLES[level];
  return {
    level,
    xpRequired: calculateAlgorithmicXp(level),
    rewards: {
      title: milestoneConfig?.title ?? getDefaultAlgorithmicTitle(level),
      badges: milestoneConfig ? [milestoneConfig.badge] : [],
    },
  };
}

/**
 * Get requirements for the next level
 */
export function getNextLevelRequirements(currentLevel: number): LevelDefinition | undefined {
  return getLevelRequirements(currentLevel + 1);
}

/**
 * Check if a level is within static configuration
 */
export function isStaticLevel(level: number): boolean {
  return level <= MAX_STATIC_LEVEL;
}

/**
 * Get the maximum statically defined level
 */
export function getMaxStaticLevel(): number {
  return MAX_STATIC_LEVEL;
}

/**
 * Debug utility: Print level progression table
 */
export function debugLevelTable(maxLevel: number = 80): void {
  console.log('Level | XP Required | XP Delta | Title');
  console.log('------|-------------|----------|------');

  let previousXp = 0;
  for (let level = 1; level <= maxLevel; level++) {
    const xp = calculateXpForLevel(level);
    const delta = xp - previousXp;
    const requirements = getLevelRequirements(level);
    const title = requirements?.rewards?.title ?? 'N/A';
    console.log(`${level.toString().padStart(5)} | ${xp.toString().padStart(11)} | ${delta.toString().padStart(8)} | ${title}`);
    previousXp = xp;
  }
}
