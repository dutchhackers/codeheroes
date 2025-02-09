import { Event } from '@codeheroes/event';
import { GithubCreateEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base/base.handler';
import { ActivityType, CreateTagActivityData } from '../../types';

export class TagCreateHandler extends BaseActivityHandler {
  protected eventActions?: string[];
  protected eventTypes = ['create'];
  protected activityType = ActivityType.TAG_CREATED;

  canHandle(event: Event): boolean {
    if (!super.canHandle(event)) return false;
    const details = event.data as GithubCreateEventData;
    return details.refType === 'tag';
  }

  handle(event: Event): CreateTagActivityData {
    const details = event.data as GithubCreateEventData;
    return {
      type: 'create_tag',
      ref: details.ref,
    };
  }

  getMetrics(event: Event) {
    return {}; // No metrics for create events
  }

  generateDescription(event: Event): string {
    const details = event.data as GithubCreateEventData;
    return `Created tag ${details.ref}`;
  }
}
