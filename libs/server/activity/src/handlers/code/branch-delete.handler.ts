import { Event } from '@codeheroes/event';
import { GithubDeleteEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base/base.handler';
import { ActivityType, DeleteBranchActivityData } from '../../types';

export class BranchDeleteHandler extends BaseActivityHandler {
  protected eventActions?: string[];
  protected eventTypes = ['delete'];
  protected activityType = ActivityType.BRANCH_DELETED;

  canHandle(event: Event): boolean {
    if (!super.canHandle(event)) return false;
    const details = event.data as GithubDeleteEventData;
    return details.refType === 'branch';
  }

  handle(event: Event): DeleteBranchActivityData {
    const details = event.data as GithubDeleteEventData;
    return {
      type: 'delete_branch',
      ref: details.ref,
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
