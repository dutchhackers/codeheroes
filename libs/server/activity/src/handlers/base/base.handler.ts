import { Event } from '@codeheroes/event';
import { ActivityType } from '@codeheroes/shared/types';
import { ActivityData, ActivityHandler } from '../../types';
import { ActivityMetrics } from '../../types/metrics.types';

export abstract class BaseActivityHandler<T extends ActivityMetrics | undefined = undefined>
  implements ActivityHandler
{
  protected abstract activityType: ActivityType;
  protected abstract eventTypes: string[];
  protected abstract eventActions?: string[];

  getActivityType(): ActivityType {
    return this.activityType;
  }

  canHandle(event: Event): boolean {
    const eventType = event.source.event;
    const eventAction = (event.data as any)?.action;

    const matchesEventType = this.eventTypes.includes(eventType);
    const matchesAction = !this.eventActions || this.eventActions.includes(eventAction);

    return matchesEventType && matchesAction;
  }

  handle(event: Event): ActivityData {
    const activityData = this.handleActivity(event);
    const metrics = this.calculateMetrics(event);

    if (metrics) {
      return {
        ...activityData,
        metrics,
      } as ActivityData;
    }

    return activityData;
  }

  abstract handleActivity(event: Event): ActivityData;

  abstract generateDescription(event: Event): string;

  protected calculateMetrics(event: Event): T {
    return undefined as T;
  }

  protected formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  protected pluralize(count: number, singular: string, plural?: string): string {
    return count === 1 ? singular : plural || `${singular}s`;
  }
}
