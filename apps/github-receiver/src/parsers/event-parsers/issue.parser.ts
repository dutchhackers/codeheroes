import { GithubIssueEventData } from '@codeheroes/providers';
import { CommonMappedData, IssueEvent } from '../../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class IssueParser extends GitHubParser<IssueEvent, GithubIssueEventData> {
  protected parseSpecific(payload: IssueEvent): Omit<GithubIssueEventData, keyof CommonMappedData> {
    return {
      action: payload.action,
      issueNumber: payload.issue.number,
      title: payload.issue.title,
      state: payload.issue.state,
      stateReason: payload.issue.state_reason || null,
    };
  }
}
