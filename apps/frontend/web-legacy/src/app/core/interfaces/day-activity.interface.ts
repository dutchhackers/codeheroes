import type { IActivity } from './activity.interface';

export interface IDayActivity {
  date: string;
  activities: IActivity[];
}
