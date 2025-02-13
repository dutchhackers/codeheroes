import type { IActivity } from '../interfaces';
import type { DayActivities } from '../types';

export function groupActivitesPerDay(activities: IActivity[]): DayActivities {
  return activities.reduce<Record<string, IActivity[]>>((acc, activity) => {
    const date = new Date(activity.createdAt).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }

    acc[date].push(activity);

    return acc;
  }, {});
}
