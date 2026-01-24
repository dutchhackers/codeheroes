import { Config } from '../lib/config';
import { buildRepository, buildSender, generateNodeId, generateNumber, generateSha, getCurrentTimestamp } from './common';

export interface PullRequestOptions {
  title?: string;
  body?: string;
  branch?: string;
  baseBranch?: string;
  number?: number;
  draft?: boolean;
}

export type PullRequestAction = 'opened' | 'closed' | 'ready_for_review';

export function buildPullRequestPayload(
  config: Config,
  action: PullRequestAction,
  options: PullRequestOptions = {},
  merged = false
) {
  const prNumber = options.number || generateNumber(1, 999);
  const title = options.title || `Feature: Add new functionality #${prNumber}`;
  const body = options.body || 'This PR adds new functionality to the project.';
  const branch = options.branch || `feature/update-${prNumber}`;
  const baseBranch = options.baseBranch || 'main';
  const timestamp = getCurrentTimestamp();
  const headSha = generateSha();
  const baseSha = generateSha();
  const prId = generateNumber(100000000, 999999999);
  const isDraft = options.draft || false;

  const state = action === 'closed' ? 'closed' : 'open';

  const pullRequest = {
    id: prId,
    node_id: generateNodeId('PR'),
    number: prNumber,
    title: title,
    state: state,
    locked: false,
    draft: isDraft,
    user: buildSender(config),
    body: body,
    created_at: timestamp,
    updated_at: timestamp,
    closed_at: action === 'closed' ? timestamp : null,
    merged_at: merged ? timestamp : null,
    merged: merged,
    merged_by: merged ? buildSender(config) : null,
    merge_commit_sha: merged ? generateSha() : null,
    assignee: null,
    assignees: [],
    requested_reviewers: [],
    requested_teams: [],
    labels: [],
    milestone: null,
    commits: generateNumber(1, 10),
    additions: generateNumber(10, 500),
    deletions: generateNumber(0, 100),
    changed_files: generateNumber(1, 20),
    comments: 0,
    review_comments: 0,
    maintainer_can_modify: true,
    mergeable: true,
    mergeable_state: 'clean',
    html_url: `https://github.com/${config.testRepository.fullName}/pull/${prNumber}`,
    diff_url: `https://github.com/${config.testRepository.fullName}/pull/${prNumber}.diff`,
    patch_url: `https://github.com/${config.testRepository.fullName}/pull/${prNumber}.patch`,
    head: {
      label: `${config.github.username}:${branch}`,
      ref: branch,
      sha: headSha,
      user: buildSender(config),
      repo: buildRepository(config),
    },
    base: {
      label: `${config.github.username}:${baseBranch}`,
      ref: baseBranch,
      sha: baseSha,
      user: buildSender(config),
      repo: buildRepository(config),
    },
  };

  return {
    action: action,
    number: prNumber,
    pull_request: pullRequest,
    repository: buildRepository(config),
    sender: buildSender(config),
  };
}
