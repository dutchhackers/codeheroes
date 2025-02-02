import { Event } from '@codeheroes/event';
import { DeleteEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base.handler';
import { ActivityType, DeleteActivityData } from '../../types';

export class DeleteHandler extends BaseActivityHandler {
  protected eventActions?: string[];
  protected eventTypes = ['delete'];
  protected activityType = ActivityType.BRANCH_DELETED;

  handle(event: Event): DeleteActivityData {
    const details = event.data as DeleteEventData;

    return {
      type: 'delete',
      ref: details.ref,
      refType: details.refType,
    };
  }

  getMetrics(event: Event) {
    return {}; // No metrics for delete events
  }

  generateDescription(event: Event): string {
    const details = event.data as DeleteEventData;
    return `Deleted ${details.refType} ${details.ref}`;
  }
}
