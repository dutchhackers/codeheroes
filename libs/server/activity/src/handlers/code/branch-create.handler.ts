import { Event } from '@codeheroes/event';
import { GithubCreateEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base/base.handler';
import { ActivityType, CreateBranchActivityData } from '../../types';

export class BranchCreateHandler extends BaseActivityHandler {
  protected eventActions?: string[];
  protected eventTypes = ['create'];
  protected activityType = ActivityType.BRANCH_CREATED;

  canHandle(event: Event): boolean {
    if (!super.canHandle(event)) return false;
    const details = event.data as GithubCreateEventData;
    return details.refType === 'branch';
  }

  handleActivity(event: Event): CreateBranchActivityData {
    const details = event.data as GithubCreateEventData;
    return {
      type: 'create_branch',
      ref: details.ref,
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as GithubCreateEventData;
    return `Created branch ${details.ref}`;
  }
}
