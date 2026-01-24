import { Config } from '../lib/config';
import { buildRepository, buildSender, generateNodeId, generateNumber, getCurrentTimestamp } from './common';

export interface ReleaseOptions {
  tagName?: string;
  name?: string;
  body?: string;
  prerelease?: boolean;
  draft?: boolean;
}

export function buildReleasePayload(config: Config, options: ReleaseOptions = {}) {
  const timestamp = getCurrentTimestamp();
  const releaseId = generateNumber(100000000, 999999999);

  const tagName = options.tagName || `v1.0.${generateNumber(0, 99)}`;
  const name = options.name || tagName;
  const body = options.body || `Release notes for ${tagName}`;
  const prerelease = options.prerelease || false;
  const draft = options.draft || false;

  const release = {
    id: releaseId,
    node_id: generateNodeId('RE'),
    tag_name: tagName,
    target_commitish: 'main',
    name: name,
    body: body,
    draft: draft,
    prerelease: prerelease,
    created_at: timestamp,
    published_at: draft ? null : timestamp,
    html_url: `https://github.com/${config.testRepository.fullName}/releases/tag/${tagName}`,
    tarball_url: `https://api.github.com/repos/${config.testRepository.fullName}/tarball/${tagName}`,
    zipball_url: `https://api.github.com/repos/${config.testRepository.fullName}/zipball/${tagName}`,
    author: buildSender(config),
    assets: [],
  };

  return {
    action: 'published' as const,
    release: release,
    repository: buildRepository(config),
    sender: buildSender(config),
  };
}
