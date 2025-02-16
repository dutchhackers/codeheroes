import { ActivityCategory, ActivityType } from '@codeheroes/shared/types';
import { UserActivity } from './activity.interfaces';

export type CreateActivityInput = Omit<UserActivity, 'id' | 'createdAt' | 'updatedAt'>;

export interface ActivityQuery {
  userId: string;
  type?: ActivityType;
  category?: ActivityCategory;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface ActivityStats {
  totalActivities: number;
  totalXpEarned: number;
  activitiesByType: Record<ActivityType, number>;
  activitiesByCategory: Record<ActivityCategory, number>;
  topMetrics: {
    mostCommits: number;
    largestPR: number;
    mostReviews: number;
  };
}
