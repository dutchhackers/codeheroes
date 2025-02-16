import { Event } from '@codeheroes/event';
import { GithubPullRequestEventData } from '@codeheroes/providers';
import { ActivityType } from '@codeheroes/shared/types';
import { PullRequestActivityData, PullRequestActivityMetrics } from '../../types';
import { BaseActivityHandler } from '../base/base.handler';

export class PrMergeHandler extends BaseActivityHandler<PullRequestActivityMetrics> {
  protected activityType = ActivityType.PR_MERGED;
  protected eventTypes = ['pull_request'];
  protected eventActions = ['closed'];

  canHandle(event: Event): boolean {
    if (!super.canHandle(event)) return false;
    const details = event.data as GithubPullRequestEventData;
    return details.merged === true;
  }

  handleActivity(event: Event): PullRequestActivityData {
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

  protected calculateMetrics(event: Event): PullRequestActivityMetrics {
    const details = event.data as GithubPullRequestEventData;
    return {
      commits: details.metrics.commits,
      additions: details.metrics.additions,
      deletions: details.metrics.deletions,
      changedFiles: details.metrics.changedFiles,
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as GithubPullRequestEventData;
    const metrics = this.calculateMetrics(event);

    return (
      `Merged pull request #${details.prNumber}: ${details.title} ` +
      `(${this.formatNumber(metrics.commits)} ${this.pluralize(metrics.commits, 'commit')}, ` +
      `${metrics.changedFiles} files changed)`
    );
  }
}
