import { PullRequestReviewThreadEventData } from '@codeheroes/providers';
import { PullRequestReviewThreadEvent } from '../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class PullRequestReviewThreadParser extends GitHubParser<
  PullRequestReviewThreadEvent,
  PullRequestReviewThreadEventData
> {
  parse(payload: PullRequestReviewThreadEvent): PullRequestReviewThreadEventData {
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
        ownerType: payload.repository.owner.type,
      },
      action: payload.action,
      prNumber: payload.pull_request.number,
      prTitle: payload.pull_request.title,
      threadId: payload.thread.id,
      resolved: payload.thread.resolved,
      ...(payload.thread.resolution && {
        resolver: {
          id: payload.thread.resolution.user.id.toString(),
          login: payload.thread.resolution.user.login,
        },
      }),
      lineDetails: {
        line: payload.thread.line,
        startLine: payload.thread.start_line,
        originalLine: payload.thread.original_line,
      },
      sender: {
        id: payload.sender.id.toString(),
        login: payload.sender.login,
      },
    };
  }
}
