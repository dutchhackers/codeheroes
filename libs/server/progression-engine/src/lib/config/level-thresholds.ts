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
 * Levels 21+: Use algorithmic formula: XP = 1500 * Level²
 *
 * This approach:
 * - Provides carefully tuned early progression
 * - Eliminates maintenance burden for 80+ levels
 * - Supports infinite scaling without "hard cap" bugs
 * - Targets Level 80 at ~9,600,000 XP
 */

/**
 * XP multiplier for algorithmic levels (21+)
 * Formula: XP = ALGORITHMIC_XP_MULTIPLIER * Level²
 */
const ALGORITHMIC_XP_MULTIPLIER = 1500;

/**
 * Calculate XP required for a given level using the algorithmic formula
 * Used for levels beyond MAX_STATIC_LEVEL
 */
function calculateAlgorithmicXp(level: number): number {
  return ALGORITHMIC_XP_MULTIPLIER * level * level;
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
        // Check algorithmic levels
        const algorithmicLevel = Math.floor(Math.sqrt(totalXp / ALGORITHMIC_XP_MULTIPLIER));
        if (algorithmicLevel > MAX_STATIC_LEVEL) {
          return algorithmicLevel;
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
  const algorithmicTitle = ALGORITHMIC_LEVEL_TITLES[level];
  return {
    level,
    xpRequired: calculateAlgorithmicXp(level),
    rewards: {
      title: algorithmicTitle?.title ?? getDefaultAlgorithmicTitle(level),
      badges: algorithmicTitle ? [algorithmicTitle.badge] : [`level_${level}_badge`],
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
