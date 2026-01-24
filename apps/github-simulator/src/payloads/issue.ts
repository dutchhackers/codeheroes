import { Config } from '../lib/config';
import { buildRepository, buildSender, generateNodeId, generateNumber, getCurrentTimestamp } from './common';

export interface IssueOptions {
  title?: string;
  body?: string;
  number?: number;
}

export type IssueAction = 'opened' | 'closed';

export function buildIssuePayload(config: Config, action: IssueAction, options: IssueOptions = {}) {
  const issueNumber = options.number || generateNumber(1, 999);
  const title = options.title || `Bug: Something is not working #${issueNumber}`;
  const body = options.body || 'This issue describes a problem that needs to be fixed.';
  const timestamp = getCurrentTimestamp();
  const issueId = generateNumber(100000000, 999999999);

  const state = action === 'closed' ? 'closed' : 'open';
  const stateReason = action === 'closed' ? 'completed' : null;

  const issue = {
    id: issueId,
    node_id: generateNodeId('I'),
    number: issueNumber,
    title: title,
    state: state,
    state_reason: stateReason,
    locked: false,
    user: buildSender(config),
    body: body,
    labels: [],
    assignee: null,
    assignees: [],
    milestone: null,
    comments: 0,
    created_at: timestamp,
    updated_at: timestamp,
    closed_at: action === 'closed' ? timestamp : null,
    html_url: `https://github.com/${config.testRepository.fullName}/issues/${issueNumber}`,
    reactions: {
      url: `https://api.github.com/repos/${config.testRepository.fullName}/issues/${issueNumber}/reactions`,
      total_count: 0,
      '+1': 0,
      '-1': 0,
      laugh: 0,
      hooray: 0,
      confused: 0,
      heart: 0,
      rocket: 0,
      eyes: 0,
    },
  };

  return {
    action: action,
    issue: issue,
    repository: buildRepository(config),
    sender: buildSender(config),
  };
}
