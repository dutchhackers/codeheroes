import { Event } from '@codeheroes/event';
import { GithubPullRequestEventData } from '@codeheroes/providers';
import { ActivityType, PullRequestActivityData, PullRequestActivityMetrics } from '../../types';
import { BaseActivityHandler } from '../base/base.handler';

export class PrUpdateHandler extends BaseActivityHandler<PullRequestActivityMetrics> {
  protected activityType = ActivityType.PR_UPDATED;
  protected eventTypes = ['pull_request'];
  protected eventActions = ['synchronize'];

  handleActivity(event: Event): PullRequestActivityData {
    const details = event.data as GithubPullRequestEventData;
    return {
      type: 'pull_request',
      prNumber: details.prNumber,
      title: details.title,
      merged: false,
      draft: details.draft,
      action: 'updated',
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
    const { commits, changedFiles } = details.metrics;

    return (
      `Updated pull request #${details.prNumber} with ${this.formatNumber(commits)} ` +
      `new ${this.pluralize(commits, 'commit')}, affecting ` +
      `${this.formatNumber(changedFiles)} ${this.pluralize(changedFiles, 'file')}`
    );
  }
}
