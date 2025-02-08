import { GithubCreateEventData } from '@codeheroes/providers';
import { CommonMappedData, CreateEvent } from '../../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class CreateParser extends GitHubParser<CreateEvent, GithubCreateEventData> {
  protected parseSpecific(payload: CreateEvent): Omit<GithubCreateEventData, keyof CommonMappedData> {
    // Accept branch, tag and repository creation events
    return {
      ref: payload.ref,
      refType: payload.ref_type,
      masterBranch: payload.master_branch,
      pusherType: payload.pusher_type,
    };
  }
}
