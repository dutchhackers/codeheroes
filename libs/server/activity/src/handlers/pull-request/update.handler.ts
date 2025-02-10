import { Event } from '@codeheroes/event';
import { GithubPullRequestEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base/base.handler';
import { ActivityType, PullRequestActivityData, PullRequestMetrics } from '../../types';

export class PrUpdateHandler extends BaseActivityHandler {
  protected activityType = ActivityType.PR_UPDATED;
  protected eventTypes = ['pull_request'];
  protected eventActions = ['synchronize'];

  handle(event: Event): PullRequestActivityData {
    const details = event.data as GithubPullRequestEventData;

    return {
      type: 'pull_request',
      prNumber: details.prNumber,
      title: details.title,
      merged: false,
      draft: details.draft,
      action: 'updated',
      metrics: { ...details.metrics },
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as GithubPullRequestEventData;
    const { commits, changedFiles } = details.metrics;

    return (
      `Updated pull request #${details.prNumber} with ${this.formatNumber(commits)} ` +
      `new ${this.pluralize(commits, 'commit')}, affecting ` +
      `${this.formatNumber(changedFiles)} ${this.pluralize(changedFiles, 'file')}`
    );
  }
}
