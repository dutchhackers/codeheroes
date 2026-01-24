import { Config } from '../lib/config';
import { buildRepository, buildSender, generateSha, getCurrentTimestamp } from './common';

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
  let beforeSha = generateSha();
  let afterSha = beforeSha;

  for (let i = 0; i < commitCount; i++) {
    afterSha = generateSha();
    const commitMessage = commitCount > 1 ? `${message} (${i + 1}/${commitCount})` : message;

    commits.push({
      id: afterSha,
      tree_id: generateSha(),
      distinct: true,
      message: commitMessage,
      timestamp: timestamp,
      url: `https://github.com/${config.testRepository.fullName}/commit/${afterSha}`,
      author: {
        name: config.github.displayName,
        email: config.github.email,
        username: config.github.username,
      },
      committer: {
        name: config.github.displayName,
        email: config.github.email,
        username: config.github.username,
      },
      added: [],
      removed: [],
      modified: ['src/index.ts'],
    });
  }

  const headCommit = commits[commits.length - 1];

  return {
    ref: `refs/heads/${branch}`,
    before: beforeSha,
    after: afterSha,
    repository: buildRepository(config),
    pusher: {
      name: config.github.username,
      email: config.github.email,
    },
    sender: buildSender(config),
    created: false,
    deleted: false,
    forced: false,
    base_ref: null,
    compare: `https://github.com/${config.testRepository.fullName}/compare/${beforeSha.substring(0, 12)}...${afterSha.substring(0, 12)}`,
    commits: commits,
    head_commit: headCommit,
  };
}
