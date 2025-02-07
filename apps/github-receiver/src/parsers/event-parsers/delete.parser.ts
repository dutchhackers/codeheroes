import { DeleteEventData } from '@codeheroes/providers';
import { CommonMappedData, DeleteEvent } from '../../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class DeleteEventParser extends GitHubParser<DeleteEvent, DeleteEventData> {
  protected parseSpecific(payload: DeleteEvent): Omit<DeleteEventData, keyof CommonMappedData> {
    return {
      ref: payload.ref,
      refType: payload.ref_type,
      pusherType: payload.pusher_type,
    };
  }
}
