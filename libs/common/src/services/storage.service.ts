import { Bucket } from '@google-cloud/storage';
import { getStorage } from 'firebase-admin/storage';
import { logger } from '../utils';

export class StorageService {
  private bucket: Bucket;

  constructor() {
    this.bucket = getStorage().bucket();
  }

  async storeFile(filePath: string, content: string, options?: { contentType?: string }): Promise<void> {
    const file = this.bucket.file(filePath);
    await file.save(content, {
      contentType: options?.contentType || 'text/plain',
    });

    logger.info(`Stored file at ${filePath}`);
  }
}
