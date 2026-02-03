/**
 * Model representing an active project derived from user activities
 */
export interface ActiveProject {
  /** Unique identifier for the project (format: owner/name) */
  id: string;
  
  /** Repository name */
  name: string;
  
  /** Repository owner */
  owner: string;
  
  /** User-facing description derived from repo name */
  displayName: string;
  
  /** Number of active contributors */
  memberCount: number;
  
  /** List of user IDs contributing to this project */
  contributors: string[];
  
  /** Timestamp of last activity on this project */
  lastActivityAt: string;
  
  /** Total number of activities for this project */
  activityCount: number;
  
  /** Breakdown of activity types */
  activityBreakdown: {
    pushes: number;
    pullRequests: number;
    reviews: number;
    issues: number;
    comments: number;
  };
  
  /** Recent activity timestamp for display */
  recentActivityDescription?: string;
}

/**
 * Helper to convert repo name to user-facing display name
 * Examples:
 * - "my-awesome-app" -> "My Awesome App"
 * - "api_service" -> "API Service"
 * - "codeheroes" -> "Codeheroes"
 */
export function formatProjectDisplayName(repoName: string): string {
  return repoName
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format time ago for display
 */
export function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}
