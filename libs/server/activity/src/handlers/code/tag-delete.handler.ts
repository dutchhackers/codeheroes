import { Event } from '@codeheroes/event';
import { GithubDeleteEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base/base.handler';
import { ActivityType, DeleteTagActivityData } from '../../types';

export class TagDeleteHandler extends BaseActivityHandler {
  protected eventActions?: string[];
  protected eventTypes = ['delete'];
  protected activityType = ActivityType.TAG_DELETED;

  canHandle(event: Event): boolean {
    if (!super.canHandle(event)) return false;
    const details = event.data as GithubDeleteEventData;
    return details.refType === 'tag';
  }

  handleActivity(event: Event): DeleteTagActivityData {
    const details = event.data as GithubDeleteEventData;
    return {
      type: 'delete_tag',
      ref: details.ref,
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as GithubDeleteEventData;
    return `Deleted tag ${details.ref}`;
  }
}
