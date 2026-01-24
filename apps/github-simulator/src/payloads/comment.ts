import { Config } from '../lib/config';
import { buildRepository, buildSender, generateNodeId, generateNumber, getCurrentTimestamp } from './common';

export interface CommentOptions {
  prNumber?: number;
  issueNumber?: number;
  body?: string;
}

export type CommentTarget = 'pr' | 'issue';

export function buildCommentPayload(config: Config, target: CommentTarget, options: CommentOptions = {}) {
  const number = target === 'pr' ? (options.prNumber || generateNumber(1, 999)) : (options.issueNumber || generateNumber(1, 999));
  const body = options.body || 'This is a comment on the ' + (target === 'pr' ? 'pull request' : 'issue') + '.';
  const timestamp = getCurrentTimestamp();
  const commentId = generateNumber(100000000, 999999999);
  const issueId = generateNumber(100000000, 999999999);

  const comment = {
    id: commentId,
    node_id: generateNodeId('IC'),
    user: buildSender(config),
    body: body,
    created_at: timestamp,
    updated_at: timestamp,
    html_url: `https://github.com/${config.testRepository.fullName}/${target === 'pr' ? 'pull' : 'issues'}/${number}#issuecomment-${commentId}`,
    issue_url: `https://api.github.com/repos/${config.testRepository.fullName}/issues/${number}`,
  };

  // For GitHub, both PRs and issues use the same "issue" structure in issue_comment events
  const issue = {
    id: issueId,
    node_id: generateNodeId('I'),
    number: number,
    title: target === 'pr' ? `Pull Request #${number}` : `Issue #${number}`,
    state: 'open',
    locked: false,
    user: buildSender(config),
    labels: [],
    assignee: null,
    assignees: [],
    milestone: null,
    comments: 1,
    created_at: timestamp,
    updated_at: timestamp,
    closed_at: null,
    html_url: `https://github.com/${config.testRepository.fullName}/${target === 'pr' ? 'pull' : 'issues'}/${number}`,
    // This field indicates if it's a PR (present) or a regular issue (absent/null)
    pull_request: target === 'pr' ? {
      url: `https://api.github.com/repos/${config.testRepository.fullName}/pulls/${number}`,
      html_url: `https://github.com/${config.testRepository.fullName}/pull/${number}`,
      diff_url: `https://github.com/${config.testRepository.fullName}/pull/${number}.diff`,
      patch_url: `https://github.com/${config.testRepository.fullName}/pull/${number}.patch`,
    } : undefined,
  };

  return {
    action: 'created',
    comment: comment,
    issue: issue,
    repository: buildRepository(config),
    sender: buildSender(config),
  };
}
