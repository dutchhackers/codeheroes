import { Event } from '@codeheroes/event';
import { PushEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base.handler';
import { ActivityType, PushActivityData, CodeMetrics } from '../../types';

export class CodePushHandler extends BaseActivityHandler {
  protected eventActions?: string[];
  protected activityType = ActivityType.CODE_PUSH;
  protected eventTypes = ['push'];

  handle(event: Event): PushActivityData {
    const details = event.data as PushEventData;

    return {
      type: 'push',
      branch: details.branch,
      commitCount: details.metrics.commits,
    };
  }

  getMetrics(event: Event): CodeMetrics {
    const details = event.data as PushEventData;

    return {
      commits: details.metrics.commits,
      additions: 0, //details.metrics.additions,
      deletions: 0, //details.metrics.deletions,
      changedFiles: 0, //details.metrics.changedFiles,
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as PushEventData;
    const { commits } = details.metrics;

    return (
      `Pushed ${this.formatNumber(commits)} ${this.pluralize(commits, 'commit')} ` +
      `to ${details.branch}`
    );
  }
}
