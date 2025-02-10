import { Event } from '@codeheroes/event';
import { GithubPullRequestEventData } from '@codeheroes/providers';
import { ActivityType, PullRequestActivityData, PullRequestActivityMetrics } from '../../types';
import { BaseActivityHandler } from '../base/base.handler';

export class PrCreateHandler extends BaseActivityHandler {
  protected activityType = ActivityType.PR_CREATED;
  protected eventTypes = ['pull_request'];
  protected eventActions = ['opened', 'ready_for_review'];

  handleActivity(event: Event): PullRequestActivityData {
    const details = event.data as GithubPullRequestEventData;
    return {
      type: 'pull_request',
      prNumber: details.prNumber,
      title: details.title,
      merged: false,
      draft: details.draft,
      action: details.action,
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

    const status = details.draft ? 'draft ' : '';
    return `Created ${status}pull request #${details.prNumber}: ${details.title} ` +
           `(${this.formatNumber(metrics.changedFiles)} ${this.pluralize(metrics.changedFiles, 'file')} changed)`;
  }
}
