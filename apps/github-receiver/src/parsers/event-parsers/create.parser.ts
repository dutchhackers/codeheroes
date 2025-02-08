import { CreateEventData } from '@codeheroes/providers';
import { CommonMappedData, CreateEvent } from '../../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class CreateParser extends GitHubParser<CreateEvent, CreateEventData> {
  protected parseSpecific(payload: CreateEvent): Omit<CreateEventData, keyof CommonMappedData> | null {
    // Skip if not a branch creation
    if (payload.ref_type !== 'branch') {
      return null;
    }

    return {
      ref: payload.ref,
      refType: payload.ref_type,
      masterBranch: payload.master_branch,
      pusherType: payload.pusher_type,
    };
  }
}
