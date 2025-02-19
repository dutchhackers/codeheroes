import { CreateTagActivityData } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { GithubCreateEventData } from '@codeheroes/providers';
import { ActivityType } from '@codeheroes/shared/types';
import { BaseActivityHandler } from '../base/base.handler';

export class TagCreateHandler extends BaseActivityHandler {
  protected eventActions?: string[];
  protected eventTypes = ['create'];
  protected activityType = ActivityType.TAG_CREATED;

  canHandle(event: Event): boolean {
    if (!super.canHandle(event)) return false;
    const details = event.data as GithubCreateEventData;
    return details.refType === 'tag';
  }

  handleActivity(event: Event): CreateTagActivityData {
    const details = event.data as GithubCreateEventData;
    return {
      type: 'create_tag',
      ref: details.ref,
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as GithubCreateEventData;
    return `Created tag ${details.ref}`;
  }
}
