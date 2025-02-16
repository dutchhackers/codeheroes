import { Event } from '@codeheroes/event';
import { GithubPushEventData } from '@codeheroes/providers';
import { ActivityType } from '@codeheroes/types';
import { PushActivityData, PushActivityMetrics } from '../../types';
import { BaseActivityHandler } from '../base/base.handler';

export class PushHandler extends BaseActivityHandler<PushActivityMetrics> {
  protected eventActions?: string[];
  protected activityType = ActivityType.CODE_PUSH;
  protected eventTypes = ['push'];

  handleActivity(event: Event): PushActivityData {
    const details = event.data as GithubPushEventData;
    return {
      type: 'push',
      branch: details.branch,
      commitCount: details.metrics.commits,
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

    return (
      `Pushed ${this.formatNumber(metrics.commits)} ${this.pluralize(metrics.commits, 'commit')} ` +
      `to ${details.branch}`
    );
  }
}
