import type { IActivity, IDayActivity } from '../interfaces';

export function groupActivitesPerDay(activities: IActivity[]): IDayActivity[] {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const groupedActivities: Record<string, IActivity[]> = Object.groupBy(
    activities,
    ({ createdAt }: { createdAt: string }) => new Date(createdAt).toISOString().split('T')[0],
  );

  const sortedResults: IDayActivity[] = [];

  Object.entries(groupedActivities).forEach(([key, value]) => {
    const existingDay = sortedResults.find((entry) => entry.date === key);
    if (existingDay) {
      existingDay.activities.push(...value);
    } else {
      sortedResults.push({ date: key, activities: value });
    }
  });

  return sortedResults;
}
