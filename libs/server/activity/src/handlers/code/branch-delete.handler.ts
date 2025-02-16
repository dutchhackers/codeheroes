import { Event } from '@codeheroes/event';
import { GithubDeleteEventData } from '@codeheroes/providers';
import { ActivityType } from '@codeheroes/shared/types';
import { DeleteBranchActivityData } from '../../types';
import { BaseActivityHandler } from '../base/base.handler';

export class BranchDeleteHandler extends BaseActivityHandler {
  protected eventActions?: string[];
  protected eventTypes = ['delete'];
  protected activityType = ActivityType.BRANCH_DELETED;

  canHandle(event: Event): boolean {
    if (!super.canHandle(event)) return false;
    const details = event.data as GithubDeleteEventData;
    return details.refType === 'branch';
  }

  handleActivity(event: Event): DeleteBranchActivityData {
    const details = event.data as GithubDeleteEventData;
    return {
      type: 'delete_branch',
      ref: details.ref,
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as GithubDeleteEventData;
    return `Deleted branch ${details.ref}`;
  }
}
