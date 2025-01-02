import { logger } from '@codeheroes/common';
import { Bucket } from '@google-cloud/storage';
import { getStorage } from 'firebase-admin/storage';
import { GitHubWebhookEvent } from '../interfaces/github-webhook-event.interface';

export class StorageService {
  private bucket: Bucket;

  constructor() {
    this.bucket = getStorage().bucket();
  }

  async storeRawRequest(event: GitHubWebhookEvent): Promise<void> {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const [year, month, day] = now.toISOString().split('T')[0].split('-');

    // path format: event-history/{source}/{eventType}/{year}/{month}/{day}/{eventId}-{timestamp}.txt
    const filePath = `event-history/${event.source}/${event.eventType}/${year}/${month}/${day}/${event.eventId}-${timestamp}.txt`;

    // Format headers similar to HTTP request format
    const headers = Object.entries(event.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const rawRequest = `${headers}\n\n${JSON.stringify(
      event.payload,
      null,
      2
    )}`;

    const file = this.bucket.file(filePath);
    await file.save(rawRequest, {
      contentType: 'text/plain',
    });

    logger.info(`Stored raw request at ${filePath}`);
  }
}
