import { Config } from '../lib/config';
import {
  buildAzureRepository,
  buildAzureUser,
  buildBaseWebhook,
  generateCommitId,
  getCurrentTimestamp,
  generateNumber,
} from './common';

export interface PushOptions {
  branch?: string;
  message?: string;
  commitCount?: number;
}

export function buildPushPayload(config: Config, options: PushOptions = {}) {
  const branch = options.branch || 'main';
  const message = options.message || 'Update code';
  const commitCount = options.commitCount || 1;
  const timestamp = getCurrentTimestamp();

  const commits = [];
  for (let i = 0; i < commitCount; i++) {
    const commitId = generateCommitId();
    const commitMessage = commitCount > 1 ? `${message} (${i + 1}/${commitCount})` : message;

    commits.push({
      commitId,
      comment: commitMessage,
      url: `https://dev.azure.com/org/${config.azureTestRepository.projectName}/_apis/git/repositories/${config.azureTestRepository.id}/commits/${commitId}`,
      author: {
        name: config.azure.displayName,
        email: config.azure.email,
        date: timestamp,
      },
      committer: {
        name: config.azure.displayName,
        email: config.azure.email,
        date: timestamp,
      },
    });
  }

  const oldObjectId = generateCommitId();
  const newObjectId = commits[commits.length - 1].commitId;

  return {
    ...buildBaseWebhook(config, 'git.push'),
    resource: {
      pushId: generateNumber(100, 9999),
      date: timestamp,
      url: `https://dev.azure.com/org/${config.azureTestRepository.projectName}/_apis/git/repositories/${config.azureTestRepository.id}/pushes/${generateNumber()}`,
      pushedBy: buildAzureUser(config),
      commits,
      refUpdates: [
        {
          name: `refs/heads/${branch}`,
          oldObjectId,
          newObjectId,
        },
      ],
      repository: buildAzureRepository(config),
    },
  };
}
