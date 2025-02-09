import { Event } from '@codeheroes/event';
import { GithubDeleteEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base/base.handler';
import { ActivityType, DeleteActivityData } from '../../types';

export class BranchDeleteHandler extends BaseActivityHandler {
  protected eventActions?: string[];
  protected eventTypes = ['delete'];
  protected activityType = ActivityType.BRANCH_DELETED;

  canHandle(event: Event): boolean {
    if (!super.canHandle(event)) return false;
    const details = event.data as GithubDeleteEventData;
    return details.refType === 'branch';
  }

  handle(event: Event): DeleteActivityData {
    const details = event.data as GithubDeleteEventData;
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
    const details = event.data as GithubDeleteEventData;
    return `Deleted branch ${details.ref}`;
  }
}
