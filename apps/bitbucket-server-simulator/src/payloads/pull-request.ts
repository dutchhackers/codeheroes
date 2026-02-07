import { Config } from '../lib/config';
import { buildActor, buildRepository, generateNumber, getCurrentTimestamp } from './common';

export interface PullRequestOptions {
  title?: string;
  description?: string;
  sourceBranch?: string;
  targetBranch?: string;
  prNumber?: number;
}

export function buildPullRequestOpenedPayload(config: Config, options: PullRequestOptions = {}) {
  const prNumber = options.prNumber || generateNumber(1, 999);
  const title = options.title || `Feature: Add new functionality #${prNumber}`;
  const description = options.description || 'This PR adds new functionality to the project.';
  const sourceBranch = options.sourceBranch || `feature/update-${prNumber}`;
  const targetBranch = options.targetBranch || 'main';
  const now = Date.now();

  return {
    eventKey: 'pr:opened',
    date: getCurrentTimestamp(),
    actor: buildActor(config),
    pullRequest: {
      id: prNumber,
      title,
      description,
      state: 'OPEN',
      createdDate: now,
      updatedDate: now,
      fromRef: {
        id: `refs/heads/${sourceBranch}`,
        displayId: sourceBranch,
        repository: buildRepository(config),
      },
      toRef: {
        id: `refs/heads/${targetBranch}`,
        displayId: targetBranch,
        repository: buildRepository(config),
      },
      author: {
        user: buildActor(config),
        role: 'AUTHOR',
      },
      reviewers: [],
      properties: {
        commentCount: 0,
      },
    },
  };
}

export function buildPullRequestMergedPayload(config: Config, options: PullRequestOptions = {}) {
  const prNumber = options.prNumber || generateNumber(1, 999);
  const title = options.title || `Feature: Add new functionality #${prNumber}`;
  const description = options.description || 'This PR adds new functionality to the project.';
  const sourceBranch = options.sourceBranch || `feature/update-${prNumber}`;
  const targetBranch = options.targetBranch || 'main';
  const createdDate = Date.now() - 3600000; // 1 hour ago
  const closedDate = Date.now();

  return {
    eventKey: 'pr:merged',
    date: getCurrentTimestamp(),
    actor: buildActor(config),
    pullRequest: {
      id: prNumber,
      title,
      description,
      state: 'MERGED',
      createdDate,
      updatedDate: closedDate,
      closedDate,
      fromRef: {
        id: `refs/heads/${sourceBranch}`,
        displayId: sourceBranch,
        repository: buildRepository(config),
      },
      toRef: {
        id: `refs/heads/${targetBranch}`,
        displayId: targetBranch,
        repository: buildRepository(config),
      },
      author: {
        user: buildActor(config),
        role: 'AUTHOR',
      },
      reviewers: [],
      properties: {
        commentCount: generateNumber(0, 10),
      },
    },
  };
}
