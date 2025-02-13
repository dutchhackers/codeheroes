import type { ActivityType } from '../types';

export function mapActivityType(activityType: ActivityType): string {
  switch (activityType) {
    case 'PR_CREATED':
      return 'Pull Request opened';
    case 'CODE_PUSH':
      return 'Commit';
    case 'PR_REVIEW_SUBMITTED':
      return 'Review';
    case 'PR_UPDATED':
      return 'Pull Request updated';
    case 'PR_MERGED':
      return 'Merged';
    case 'PR_REVIEW_THREAD_RESOLVED':
      return 'Review resolved';
    default:
      return 'Unknown';
  }
}
