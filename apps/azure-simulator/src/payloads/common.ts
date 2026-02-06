import * as crypto from 'crypto';
import { Config } from '../lib/config';

export function generateGuid(): string {
  return crypto.randomUUID();
}

export function generateCommitId(): string {
  return crypto.randomBytes(20).toString('hex');
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function generateNumber(min = 1, max = 1000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function buildAzureUser(config: Config) {
  return {
    id: config.azure.userId,
    displayName: config.azure.displayName,
    uniqueName: config.azure.uniqueName,
  };
}

export function buildAzureRepository(config: Config) {
  return {
    id: config.azureTestRepository.id,
    name: config.azureTestRepository.name,
    url: `https://dev.azure.com/org/${config.azureTestRepository.projectName}/_apis/git/repositories/${config.azureTestRepository.id}`,
    project: {
      id: config.azureTestRepository.projectId,
      name: config.azureTestRepository.projectName,
    },
  };
}

export function buildBaseWebhook(config: Config, eventType: string) {
  return {
    subscriptionId: generateGuid(),
    notificationId: generateNumber(1, 99999),
    id: generateGuid(),
    eventType,
    publisherId: 'tfs',
    resourceVersion: '1.0',
    createdDate: getCurrentTimestamp(),
  };
}
