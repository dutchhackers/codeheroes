import { GithubPullRequestEventData } from '@codeheroes/providers';
import { CommonMappedData, PullRequestEvent } from '../../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class PullRequestParser extends GitHubParser<PullRequestEvent, GithubPullRequestEventData> {
  protected parseSpecific(payload: PullRequestEvent): Omit<GithubPullRequestEventData, keyof CommonMappedData> {
    const { pull_request } = payload;

    return {
      action: payload.action,
      prNumber: payload.number,
      title: pull_request.title,
      state: pull_request.state,
      merged: pull_request.merged || false,
      draft: pull_request.draft || false,
      createdAt: pull_request.created_at,
      updatedAt: pull_request.updated_at,
      ...(pull_request.merged_at && {
        mergedAt: pull_request.merged_at,
        mergedBy: this.mapUser(pull_request.merged_by!),
      }),
      metrics: {
        commits: pull_request.commits,
        additions: pull_request.additions,
        deletions: pull_request.deletions,
        changedFiles: pull_request.changed_files,
      },
    };
  }
}
