/**
 * Shared utility functions for leaderboard display formatting
 */

/**
 * Gets the initials from a user's display name
 * @param name The user's display name
 * @returns Up to 2 uppercase initials
 */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Formats a user's display name to fit within available space
 * @param name The user's display name
 * @param maxLength Maximum length before truncating (default: 15)
 * @param fallbackLength Fallback length for single names (default: 12)
 * @returns Formatted display name
 */
export function formatName(name: string, maxLength = 15, fallbackLength = 12): string {
  if (name.length <= maxLength) return name;
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1].charAt(0)}.`;
  }
  return name.slice(0, fallbackLength) + '...';
}

/**
 * Formats XP value for display
 * @param xp The XP value to format
 * @returns Formatted XP string (e.g., "1.5K XP" or "500 XP")
 */
export function formatXp(xp: number): string {
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K XP`;
  }
  return `${xp} XP`;
}
