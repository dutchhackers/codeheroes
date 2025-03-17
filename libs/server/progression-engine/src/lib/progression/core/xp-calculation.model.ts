import { GameActionType } from '@codeheroes/types';

/**
 * Result of an XP calculation
 */
export interface XpCalculationResult {
  /** Base XP amount for the action type */
  baseXp: number;

  /** Additional XP from bonuses */
  bonusXp: number;

  /** Total XP (base + bonus) */
  total: number;

  /** Detailed breakdown of XP sources */
  breakdown: XpBreakdownItem[];
}

/**
 * Single item in an XP breakdown
 */
export interface XpBreakdownItem {
  /** Type/source of XP */
  type: string;

  /** Amount of XP from this source */
  amount: number;

  /** User-friendly description of this XP source */
  description: string;
}

/**
 * Configuration for XP values by action type
 */
export interface XpConfig {
  /** Base XP values for each action type */
  baseValues: Record<GameActionType, number>;

  /** Bonus XP multipliers for different contexts */
  bonuses: {
    /** Multiplier for consecutive activities */
    streak: number;

    /** Multiplier for first daily activity */
    firstDaily: number;

    /** Specific bonuses by action type */
    byType: Partial<Record<GameActionType, number>>;
  };

  /** Caps and limits */
  limits: {
    /** Maximum daily XP */
    maxDailyXp?: number;

    /** Maximum XP per action type */
    maxPerActionType?: Partial<Record<GameActionType, number>>;
  };
}
