import { Event } from '@codeheroes/event';
import { GithubPushEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base/base.handler';
import { ActivityType, PushActivityData, PushActivityMetrics } from '../../types';

export class PushHandler extends BaseActivityHandler {
  protected eventActions?: string[];
  protected activityType = ActivityType.CODE_PUSH;
  protected eventTypes = ['push'];

  handle(event: Event): PushActivityData {
    const details = event.data as GithubPushEventData;

    return {
      type: 'push',
      branch: details.branch,
      commitCount: details.metrics.commits,
      metrics: this.calculateMetrics(event),
    };
  }

  protected calculateMetrics(event: Event): PushActivityMetrics {
    const details = event.data as GithubPushEventData;
    return {
      commits: details.metrics.commits,
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as GithubPushEventData;
    const metrics = this.calculateMetrics(event);

    return `Pushed ${this.formatNumber(metrics.commits)} ${this.pluralize(metrics.commits, 'commit')} ` +
           `to ${details.branch}`;
  }
}
