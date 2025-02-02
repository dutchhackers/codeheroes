import { Event } from '@codeheroes/event';
import { PullRequestEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base.handler';
import { ActivityType, PullRequestActivityData, PullRequestMetrics } from '../../types';

export class PrUpdateHandler extends BaseActivityHandler {
  protected activityType = ActivityType.PR_UPDATED;
  protected eventTypes = ['pull_request'];
  protected eventActions = ['synchronize'];

  handle(event: Event): PullRequestActivityData {
    const details = event.data as PullRequestEventData;

    return {
      type: 'pull_request',
      prNumber: details.prNumber,
      title: details.title,
      merged: false,
      draft: details.draft,
      action: 'updated',
    };
  }

  getMetrics(event: Event): PullRequestMetrics {
    const details = event.data as PullRequestEventData;

    return {
      commits: details.metrics.commits,
      // additions: details.metrics.additions,
      // deletions: details.metrics.deletions,
      // changedFiles: details.metrics.changedFiles,
      // reviewCount: details.metrics.reviewCount || 0,
      // commentCount: details.metrics.commentCount || 0,
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as PullRequestEventData;
    const { commits, changedFiles } = details.metrics;

    return (
      `Updated pull request #${details.prNumber} with ${this.formatNumber(commits)} ` +
      `new ${this.pluralize(commits, 'commit')}, affecting ` +
      `${this.formatNumber(changedFiles)} ${this.pluralize(changedFiles, 'file')}`
    );
  }
}
