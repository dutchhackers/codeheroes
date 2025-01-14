import { StorageService } from '@codeheroes/common';
import { GitHubWebhookEvent } from '../processors/interfaces';

export class GitHubStorageUtils {
  private static formatHeaders(headers: Record<string, string | string[] | undefined>): string {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  private static generateFilePath(event: GitHubWebhookEvent): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const [year, month, day] = now.toISOString().split('T')[0].split('-');

    return `event-history/${event.source}/${event.eventType}/${year}/${month}/${day}/${event.eventId}-${timestamp}.txt`;
  }

  static async storeGitHubEvent(storageService: StorageService, event: GitHubWebhookEvent): Promise<void> {
    const filePath = this.generateFilePath(event);
    const headers = this.formatHeaders(event.headers);
    const content = `${headers}\n\n${JSON.stringify(event.payload, null, 2)}`;

    await storageService.storeFile(filePath, content, { contentType: 'text/plain' });
  }
}
