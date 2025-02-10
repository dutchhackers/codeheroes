import { Event } from '@codeheroes/event';
import { ActivityData, ActivityHandler, ActivityType, ActivityMetrics } from '../../types';

export abstract class BaseActivityHandler implements ActivityHandler {
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

  abstract handle(event: Event): ActivityData;

  abstract generateDescription(event: Event): string;

  protected calculateMetrics(event: Event): ActivityMetrics | undefined {
    return undefined;
  }

  protected formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  protected pluralize(count: number, singular: string, plural?: string): string {
    return count === 1 ? singular : plural || `${singular}s`;
  }
}
