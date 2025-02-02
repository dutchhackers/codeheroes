import { PushEventData } from '@codeheroes/providers';
import { CommonMappedData, PushEvent } from '../../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class PushEventParser extends GitHubParser<PushEvent, PushEventData> {
  protected parseSpecific(payload: PushEvent): Omit<PushEventData, keyof CommonMappedData> {
    return {
      metrics: {
        commits: payload.commits.length,
      },
      branch: payload.ref,
      lastCommitMessage: payload.head_commit?.message || null,
    };
  }
}
