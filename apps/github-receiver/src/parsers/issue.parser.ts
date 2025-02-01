import { IssueEventData } from '@codeheroes/providers';
import { IssueEvent } from '../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class IssueParser extends GitHubParser<IssueEvent, IssueEventData> {
  parse(payload: IssueEvent): IssueEventData {
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
        ownerType: payload.repository.owner.type,
      },
      action: payload.action,
      issueNumber: payload.issue.number,
      title: payload.issue.title,
      state: payload.issue.state,
      stateReason: payload.issue.state_reason || null,
      sender: {
        id: payload.sender.id.toString(),
        login: payload.sender.login,
      },
    };
  }
}
