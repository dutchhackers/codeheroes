import { Config } from '../lib/config';
import { buildActor, buildRepository, generateHash, getCurrentTimestamp } from './common';

export interface PushOptions {
  branch?: string;
  message?: string;
  commitCount?: number;
}

export function buildPushPayload(config: Config, options: PushOptions = {}) {
  const branch = options.branch || 'main';
  const message = options.message || 'Update code';
  const commitCount = options.commitCount || 1;
  const now = Date.now();

  const commits = [];
  for (let i = 0; i < commitCount; i++) {
    const id = generateHash();
    const commitMessage = commitCount > 1 ? `${message} (${i + 1}/${commitCount})` : message;

    commits.push({
      id,
      displayId: id.substring(0, 7),
      message: commitMessage,
      authorTimestamp: now,
      author: {
        name: config.bitbucketServer.displayName,
        emailAddress: config.bitbucketServer.emailAddress,
      },
      committer: {
        name: config.bitbucketServer.displayName,
        emailAddress: config.bitbucketServer.emailAddress,
      },
    });
  }

  const fromHash = generateHash();
  const toHash = commits[commits.length - 1].id;

  return {
    eventKey: 'repo:refs_changed',
    date: getCurrentTimestamp(),
    actor: buildActor(config),
    repository: buildRepository(config),
    changes: [
      {
        ref: {
          id: `refs/heads/${branch}`,
          displayId: branch,
          type: 'BRANCH',
        },
        refId: `refs/heads/${branch}`,
        fromHash,
        toHash,
        type: 'UPDATE',
      },
    ],
    commits,
  };
}
