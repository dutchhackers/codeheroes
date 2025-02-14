import type { ActivityType } from '../types';

export function mapActivityType(activityType: ActivityType): string {
  switch (activityType) {
    case 'PR_CREATED':
      return 'Pull Request opened';
    case 'CODE_PUSH':
      return 'Push';
    case 'PR_REVIEW_SUBMITTED':
      return 'Review';
    case 'PR_UPDATED':
      return 'Pull Request updated';
    case 'PR_MERGED':
      return 'Pull Request merged';
    case 'PR_REVIEW_THREAD_RESOLVED':
      return 'Review resolved';
    case 'BRANCH_CREATED':
      return 'Branch created';
    case 'BRANCH_DELETED':
      return 'Branch deleted';
    default:
      return 'Unknown';
  }
}
