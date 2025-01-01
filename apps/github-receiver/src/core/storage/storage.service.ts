import { logger } from '@codeheroes/common';
import { Bucket } from '@google-cloud/storage';
import { Request } from 'express';
import { getStorage } from 'firebase-admin/storage';

export class StorageService {
  private bucket: Bucket;

  constructor() {
    this.bucket = getStorage().bucket();
  }

  async storeRawRequest(
    req: Request,
    source: string,
    eventType: string,
    eventId: string
  ): Promise<void> {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const [year, month, day] = now.toISOString().split('T')[0].split('-');

    const filePath = `event-history/${source}/${eventType}/${year}/${month}/${day}/${eventId}-${timestamp}.txt`;

    const requestLine = `${req.method} ${req.originalUrl} HTTP/${req.httpVersion}`;
    const headers = Object.entries(req.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    const rawRequest = `${requestLine}\n${headers}\n\n${JSON.stringify(
      req.body
    )}`;

    const file = this.bucket.file(filePath);
    await file.save(rawRequest, {
      contentType: 'text/plain',
    });

    logger.info(`Stored raw request at ${filePath}`);
  }
}
