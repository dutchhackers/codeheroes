import { Event } from '@codeheroes/event';
import { GithubPullRequestEventData } from '@codeheroes/providers';
import { ActivityType, PullRequestActivityData, PullRequestMetrics } from '../../types';
import { BaseActivityHandler } from '../base/base.handler';

export class PrMergeHandler extends BaseActivityHandler {
  protected activityType = ActivityType.PR_MERGED;
  protected eventTypes = ['pull_request'];
  protected eventActions = ['closed'];

  canHandle(event: Event): boolean {
    if (!super.canHandle(event)) return false;

    const details = event.data as GithubPullRequestEventData;
    return details.merged === true;
  }

  handle(event: Event): PullRequestActivityData {
    const details = event.data as GithubPullRequestEventData;

    return {
      type: 'pull_request',
      prNumber: details.prNumber,
      title: details.title,
      merged: true,
      draft: false,
      action: 'merged',
    };
  }

  getMetrics(event: Event): PullRequestMetrics {
    const details = event.data as GithubPullRequestEventData;

    return {
      commits: details.metrics.commits,
      // additions: details.metrics.additions,
      // deletions: details.metrics.deletions,
      // changedFiles: details.metrics.changedFiles,
      // timeToMerge: TimeUtils.calculateTimeBetween(details.createdAt, details.mergedAt),
      // timeToFirstReview: details.metrics.timeToFirstReview,
      // reviewCount: details.metrics.reviewCount || 0,
      // commentCount: details.metrics.commentCount || 0,
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as GithubPullRequestEventData;
    const { commits } = details.metrics;

    return (
      `Merged pull request #${details.prNumber}: ${details.title} ` +
      `(${this.formatNumber(commits)} ${this.pluralize(commits, 'commit')}, `
    );
  }
}
