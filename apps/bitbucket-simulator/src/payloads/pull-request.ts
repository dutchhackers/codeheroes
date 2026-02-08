import { Config } from '../lib/config';
import { buildActor, buildRepository, generateNumber, getCurrentTimestamp } from './common';

export interface PullRequestOptions {
  title?: string;
  description?: string;
  sourceBranch?: string;
  targetBranch?: string;
  prNumber?: number;
}

export function buildPullRequestCreatedPayload(config: Config, options: PullRequestOptions = {}) {
  const prNumber = options.prNumber || generateNumber(1, 999);
  const title = options.title || `Feature: Add new functionality #${prNumber}`;
  const description = options.description || 'This PR adds new functionality to the project.';
  const sourceBranch = options.sourceBranch || `feature/update-${prNumber}`;
  const targetBranch = options.targetBranch || 'main';
  const timestamp = getCurrentTimestamp();

  return {
    actor: buildActor(config),
    repository: buildRepository(config),
    pullrequest: {
      id: prNumber,
      title,
      description,
      state: 'OPEN',
      created_on: timestamp,
      updated_on: timestamp,
      close_source_branch: false,
      author: buildActor(config),
      source: {
        branch: { name: sourceBranch },
        repository: buildRepository(config),
      },
      destination: {
        branch: { name: targetBranch },
        repository: buildRepository(config),
      },
      comment_count: 0,
      task_count: 0,
    },
  };
}

export function buildPullRequestMergedPayload(config: Config, options: PullRequestOptions = {}) {
  const prNumber = options.prNumber || generateNumber(1, 999);
  const title = options.title || `Feature: Add new functionality #${prNumber}`;
  const description = options.description || 'This PR adds new functionality to the project.';
  const sourceBranch = options.sourceBranch || `feature/update-${prNumber}`;
  const targetBranch = options.targetBranch || 'main';
  const createdOn = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
  const updatedOn = getCurrentTimestamp();

  return {
    actor: buildActor(config),
    repository: buildRepository(config),
    pullrequest: {
      id: prNumber,
      title,
      description,
      state: 'MERGED',
      created_on: createdOn,
      updated_on: updatedOn,
      merge_commit: { hash: require('crypto').randomBytes(20).toString('hex') },
      close_source_branch: true,
      author: buildActor(config),
      source: {
        branch: { name: sourceBranch },
        repository: buildRepository(config),
      },
      destination: {
        branch: { name: targetBranch },
        repository: buildRepository(config),
      },
      comment_count: generateNumber(0, 10),
      task_count: 0,
    },
  };
}
