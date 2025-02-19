import { GithubPushEventData } from '@codeheroes/providers';
import { CommonMappedData, PushEvent } from '../../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class PushParser extends GitHubParser<PushEvent, GithubPushEventData> {
  protected parseSpecific(payload: PushEvent): Omit<GithubPushEventData, keyof CommonMappedData> {
    return {
      branch: payload.ref.replace('refs/heads/', ''),
      created: payload.created,
      deleted: payload.deleted,
      forced: payload.forced,
      pusher: {
        name: payload.pusher.name,
        email: payload.pusher.email,
      },
      commits: this.mapCommits(payload.commits),
      metrics: {
        commits: payload.commits.length,
      },
    };
  }
}
