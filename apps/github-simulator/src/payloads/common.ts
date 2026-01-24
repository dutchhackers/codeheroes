import * as crypto from 'crypto';
import { Config } from '../lib/config';

export function generateSha(): string {
  return crypto.randomBytes(20).toString('hex');
}

export function generateNodeId(prefix: string): string {
  const id = crypto.randomBytes(12).toString('base64');
  return `${prefix}_${id}`;
}

export function buildSender(config: Config) {
  return {
    login: config.github.username,
    id: config.github.userId,
    node_id: config.github.nodeId,
    avatar_url: `https://avatars.githubusercontent.com/u/${config.github.userId}?v=4`,
    html_url: `https://github.com/${config.github.username}`,
    type: 'User' as const,
  };
}

export function buildRepository(config: Config) {
  return {
    id: config.testRepository.id,
    node_id: config.testRepository.nodeId,
    name: config.testRepository.name,
    full_name: config.testRepository.fullName,
    private: false,
    owner: buildSender(config),
    html_url: `https://github.com/${config.testRepository.fullName}`,
    description: 'Test repository for CodeHeroes webhook testing',
  };
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function generateNumber(min = 1, max = 1000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
