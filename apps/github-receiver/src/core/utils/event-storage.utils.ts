import { GitHubWebhookEvent } from '../processors/interfaces';

export class EventStorageUtils {
  static formatHeaders(headers: Record<string, string | string[] | undefined>): string {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  static generateFilePath(event: GitHubWebhookEvent): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const [year, month, day] = now.toISOString().split('T')[0].split('-');

    return `event-history/${event.provider}/${event.eventType}/${year}/${month}/${day}/${event.eventId}-${timestamp}.txt`;
  }
}
