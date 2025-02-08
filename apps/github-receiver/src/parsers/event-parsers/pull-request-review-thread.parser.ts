import { GithubPullRequestReviewThreadEventData } from '@codeheroes/providers';
import { CommonMappedData, PullRequestReviewThreadEvent } from '../../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class PullRequestReviewThreadParser extends GitHubParser<
  PullRequestReviewThreadEvent,
  GithubPullRequestReviewThreadEventData
> {
  protected parseSpecific(payload: PullRequestReviewThreadEvent): Omit<GithubPullRequestReviewThreadEventData, keyof CommonMappedData> {
    const { thread, pull_request } = payload;

    return {
      action: payload.action,
      prNumber: pull_request.number,
      prTitle: pull_request.title,
      threadId: thread.id,
      resolved: thread.resolved,
      ...(thread.resolution && {
        resolver: this.mapUser(thread.resolution.user),
      }),
      lineDetails: {
        line: thread.line,
        startLine: thread.start_line,
        originalLine: thread.original_line,
      },
    };
  }
}
