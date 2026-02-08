import * as crypto from 'crypto';
import { Config } from '../lib/config';

export function generateHash(): string {
  return crypto.randomBytes(20).toString('hex');
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function generateNumber(min = 1, max = 1000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function buildActor(config: Config) {
  return {
    account_id: config.bitbucket.accountId,
    display_name: config.bitbucket.displayName,
    nickname: config.bitbucket.nickname,
    uuid: config.bitbucket.uuid,
  };
}

export function buildRepository(config: Config) {
  return {
    uuid: config.testRepository.uuid,
    name: config.testRepository.name,
    full_name: config.testRepository.fullName,
    workspace: {
      slug: config.testRepository.workspaceSlug,
      name: config.testRepository.workspaceName,
      uuid: config.testRepository.workspaceUuid,
    },
  };
}
