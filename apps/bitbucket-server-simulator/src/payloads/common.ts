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
    id: config.bitbucketServer.id,
    name: config.bitbucketServer.name,
    emailAddress: config.bitbucketServer.emailAddress,
    displayName: config.bitbucketServer.displayName,
    slug: config.bitbucketServer.slug,
  };
}

export function buildRepository(config: Config) {
  return {
    id: config.testRepository.id,
    slug: config.testRepository.slug,
    name: config.testRepository.name,
    project: {
      id: config.testRepository.projectId,
      key: config.testRepository.projectKey,
      name: config.testRepository.projectName,
    },
  };
}
