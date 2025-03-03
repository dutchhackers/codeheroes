import { getCurrentTimeAsISO } from '@codeheroes/common';

export interface TimePeriod {
  daily: string;
  weekly: string;
}

/**
 * Get daily (YYYY-MM-DD) and weekly (YYYY-WXX) IDs for a given timestamp
 */
export function getTimePeriodIds(timestamp?: string): TimePeriod {
  const date = timestamp ? new Date(timestamp) : new Date();

  // Daily ID: YYYY-MM-DD
  const dailyId = date.toISOString().slice(0, 10);

  // Weekly ID: YYYY-WXX
  const weekNumber = getISOWeekNumber(date);
  const weeklyId = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;

  return { daily: dailyId, weekly: weeklyId };
}

/**
 * Calculate ISO week number for consistent weekly grouping
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7)); // Set to nearest Thursday
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get the ISO week and year for a given date
 */
export function getISOWeekYear(date: Date): { year: number; week: number } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return {
    year: d.getFullYear(),
    week: weekNum,
  };
}

/**
 * Generate an array of daily IDs for a given number of past days
 */
export function getRecentDailyIds(days: number): string[] {
  const dailyIds: string[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dailyIds.push(date.toISOString().slice(0, 10));
  }

  return dailyIds;
}

/**
 * Generate an array of weekly IDs for a given number of past weeks
 */
export function getRecentWeeklyIds(weeks: number): string[] {
  const weeklyIds: string[] = [];
  const now = new Date();

  for (let i = 0; i < weeks; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);
    const { year, week } = getISOWeekYear(date);
    weeklyIds.push(`${year}-W${week.toString().padStart(2, '0')}`);
  }

  return weeklyIds;
}

/**
 * Gets a consistent timestamp in UTC for the start of a day
 */
export function getDayStartTimestamp(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Gets a consistent timestamp in UTC for the end of a day
 */
export function getDayEndTimestamp(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}
