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
  const timestamp = getCurrentTimestamp();

  const commits = [];
  for (let i = 0; i < commitCount; i++) {
    const hash = generateHash();
    const commitMessage = commitCount > 1 ? `${message} (${i + 1}/${commitCount})` : message;

    commits.push({
      hash,
      message: commitMessage,
      date: timestamp,
      author: {
        raw: `${config.bitbucketCloud.displayName} <${config.bitbucketCloud.email}>`,
        user: buildActor(config),
      },
    });
  }

  const targetHash = commits[commits.length - 1].hash;
  const oldHash = generateHash();

  return {
    actor: buildActor(config),
    repository: buildRepository(config),
    push: {
      changes: [
        {
          new: {
            type: 'branch',
            name: branch,
            target: {
              hash: targetHash,
              date: timestamp,
              message,
              author: {
                raw: `${config.bitbucketCloud.displayName} <${config.bitbucketCloud.email}>`,
                user: buildActor(config),
              },
            },
          },
          old: {
            type: 'branch',
            name: branch,
            target: { hash: oldHash },
          },
          created: false,
          closed: false,
          forced: false,
          commits,
        },
      ],
    },
  };
}
