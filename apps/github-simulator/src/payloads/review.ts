import { Config } from '../lib/config';
import { buildRepository, buildSender, generateNodeId, generateNumber, generateSha, getCurrentTimestamp } from './common';

export interface ReviewOptions {
  prNumber?: number;
  body?: string;
}

export type ReviewState = 'approved' | 'changes_requested' | 'commented';

export function buildReviewPayload(config: Config, state: ReviewState, options: ReviewOptions = {}) {
  const prNumber = options.prNumber || generateNumber(1, 999);
  const body = options.body || getDefaultReviewBody(state);
  const timestamp = getCurrentTimestamp();
  const reviewId = generateNumber(100000000, 999999999);
  const prId = generateNumber(100000000, 999999999);
  const commitId = generateSha();

  const review = {
    id: reviewId,
    node_id: generateNodeId('PRR'),
    user: buildSender(config),
    body: body,
    state: state,
    submitted_at: timestamp,
    commit_id: commitId,
    html_url: `https://github.com/${config.testRepository.fullName}/pull/${prNumber}#pullrequestreview-${reviewId}`,
    pull_request_url: `https://api.github.com/repos/${config.testRepository.fullName}/pulls/${prNumber}`,
    _links: {
      html: {
        href: `https://github.com/${config.testRepository.fullName}/pull/${prNumber}#pullrequestreview-${reviewId}`,
      },
      pull_request: {
        href: `https://api.github.com/repos/${config.testRepository.fullName}/pulls/${prNumber}`,
      },
    },
  };

  const pullRequest = {
    id: prId,
    number: prNumber,
    title: `Feature: Update #${prNumber}`,
    state: 'open',
    html_url: `https://github.com/${config.testRepository.fullName}/pull/${prNumber}`,
  };

  return {
    action: 'submitted',
    review: review,
    pull_request: pullRequest,
    repository: buildRepository(config),
    sender: buildSender(config),
  };
}

function getDefaultReviewBody(state: ReviewState): string {
  switch (state) {
    case 'approved':
      return 'LGTM! Great work.';
    case 'changes_requested':
      return 'Please address the comments before merging.';
    case 'commented':
      return 'Left some comments for consideration.';
    default:
      return '';
  }
}
