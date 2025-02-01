import { PullRequestEventData } from '@codeheroes/providers';
import { PullRequestEvent } from '../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class PullRequestParser extends GitHubParser<PullRequestEvent, PullRequestEventData> {
  parse(payload: PullRequestEvent): PullRequestEventData {
    const { pull_request } = payload;
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
        ownerType: payload.repository.owner.type,
      },
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
        mergedBy: {
          id: pull_request.merged_by!.id.toString(),
          login: pull_request.merged_by!.login,
        },
      }),
      metrics: {
        commits: pull_request.commits,
        additions: pull_request.additions,
        deletions: pull_request.deletions,
        changedFiles: pull_request.changed_files,
      },
      sender: {
        id: payload.sender.id.toString(),
        login: payload.sender.login,
      },
    };
  }
}
