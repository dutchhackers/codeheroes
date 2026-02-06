import { Config } from '../lib/config';
import {
  buildAzureRepository,
  buildAzureUser,
  buildBaseWebhook,
  generateNumber,
  getCurrentTimestamp,
} from './common';

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
    ...buildBaseWebhook(config, 'git.pullrequest.created'),
    resource: {
      pullRequestId: prNumber,
      status: 'active',
      title,
      description,
      sourceRefName: `refs/heads/${sourceBranch}`,
      targetRefName: `refs/heads/${targetBranch}`,
      mergeStatus: 'succeeded',
      creationDate: timestamp,
      url: `https://dev.azure.com/org/${config.azureTestRepository.projectName}/_apis/git/pullRequests/${prNumber}`,
      createdBy: buildAzureUser(config),
      repository: buildAzureRepository(config),
    },
  };
}

export function buildPullRequestMergedPayload(config: Config, options: PullRequestOptions = {}) {
  const prNumber = options.prNumber || generateNumber(1, 999);
  const title = options.title || `Feature: Add new functionality #${prNumber}`;
  const description = options.description || 'This PR adds new functionality to the project.';
  const sourceBranch = options.sourceBranch || `feature/update-${prNumber}`;
  const targetBranch = options.targetBranch || 'main';
  const creationDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
  const closedDate = getCurrentTimestamp();

  return {
    ...buildBaseWebhook(config, 'git.pullrequest.merged'),
    resource: {
      pullRequestId: prNumber,
      status: 'completed',
      title,
      description,
      sourceRefName: `refs/heads/${sourceBranch}`,
      targetRefName: `refs/heads/${targetBranch}`,
      mergeStatus: 'succeeded',
      creationDate,
      closedDate,
      url: `https://dev.azure.com/org/${config.azureTestRepository.projectName}/_apis/git/pullRequests/${prNumber}`,
      createdBy: buildAzureUser(config),
      repository: buildAzureRepository(config),
    },
  };
}
