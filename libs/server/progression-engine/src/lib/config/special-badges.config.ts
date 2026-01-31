import { BadgeRarity } from '@codeheroes/types';
import { BadgeDefinition } from './badge-catalog.config';

/**
 * Special badge definitions - awarded for unique behaviors and patterns
 */
export const SPECIAL_BADGES: Record<string, BadgeDefinition> = {
  // ═══════════════════════════════════════════════════════════════════
  // TIME-BASED BADGES
  // ═══════════════════════════════════════════════════════════════════
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Submitted code before 7 AM',
    icon: '🌅',
    rarity: BadgeRarity.UNCOMMON,
    category: 'special',
    metadata: { trigger: 'time_early', hour: 7 },
  },
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Submitted code after 11 PM',
    icon: '🦉',
    rarity: BadgeRarity.UNCOMMON,
    category: 'special',
    metadata: { trigger: 'time_late', hour: 23 },
  },
  weekend_warrior: {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Completed 5 activities on a weekend',
    icon: '⚔️',
    rarity: BadgeRarity.RARE,
    category: 'special',
    metadata: { trigger: 'weekend_count', threshold: 5 },
  },

  // ═══════════════════════════════════════════════════════════════════
  // STREAK BADGES (Future)
  // ═══════════════════════════════════════════════════════════════════
  // streak_master: {
  //   id: 'streak_master',
  //   name: 'Streak Master',
  //   description: 'Maintained a 7-day activity streak',
  //   icon: '🔥',
  //   rarity: BadgeRarity.RARE,
  //   category: 'special',
  //   metadata: { trigger: 'streak', days: 7 },
  // },
  // marathon_coder: {
  //   id: 'marathon_coder',
  //   name: 'Marathon Coder',
  //   description: 'Maintained a 30-day activity streak',
  //   icon: '🏃',
  //   rarity: BadgeRarity.EPIC,
  //   category: 'special',
  //   metadata: { trigger: 'streak', days: 30 },
  // },

  // ═══════════════════════════════════════════════════════════════════
  // SEASONAL BADGES (Future)
  // ═══════════════════════════════════════════════════════════════════
  // friday_deploy: {
  //   id: 'friday_deploy',
  //   name: 'Friday Deploy',
  //   description: 'Published a release on a Friday',
  //   icon: '🎰',
  //   rarity: BadgeRarity.UNCOMMON,
  //   category: 'special',
  //   metadata: { trigger: 'friday_release' },
  // },
};

/**
 * Time-based badge trigger types
 */
export type TimeTrigger = 'time_early' | 'time_late' | 'weekend_count';

/**
 * Check if a timestamp qualifies for early bird (before 7 AM)
 */
export function isEarlyBird(timestamp: Date | string): boolean {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const hour = date.getHours();
  return hour < 7;
}

/**
 * Check if a timestamp qualifies for night owl (after 11 PM)
 */
export function isNightOwl(timestamp: Date | string): boolean {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const hour = date.getHours();
  return hour >= 23;
}

/**
 * Check if a timestamp is on a weekend (Saturday or Sunday)
 */
export function isWeekend(timestamp: Date | string): boolean {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Get ISO-8601 week year and number for a date.
 * ISO-8601 defines week 1 as the week with the first Thursday of the year.
 */
function getIsoWeekYearAndNumber(date: Date): { year: number; week: number } {
  // Convert to a UTC date stripped of time to avoid timezone/DST issues
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  // ISO weekday: Monday = 1, Sunday = 7
  const dayOfWeek = d.getUTCDay() || 7;

  // Shift date to the Thursday of this week (ISO-8601 defines weeks based on Thursdays)
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);

  const isoYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));

  // Calculate ISO week number: week 1 is the week with the first Thursday of the year
  const dayOfYear = (d.getTime() - yearStart.getTime()) / 86400000 + 1;
  const isoWeek = Math.ceil(dayOfYear / 7);

  return { year: isoYear, week: isoWeek };
}

/**
 * Get the weekend identifier for a date (e.g., "2024-W05-weekend")
 * Uses ISO-8601 week numbering (week 1 is the week with the first Thursday of the year).
 * Used to track weekend activity counts
 */
export function getWeekendId(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const { year, week } = getIsoWeekYearAndNumber(date);
  return `${year}-W${week.toString().padStart(2, '0')}-weekend`;
}
