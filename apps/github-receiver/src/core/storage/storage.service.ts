import { getStorage, ref, uploadString } from "firebase/storage";
import { logger } from '@codeheroes/common';
import { Request } from 'express';

export class StorageService {
  private storage;

  constructor() {
    this.storage = getStorage();
  }

  async storeRawRequest(
    req: Request,
    source: string,
    eventType: string,
    eventId: string
  ): Promise<void> {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filePath = `${source}/${eventType}/${eventId}-${timestamp}.json`;

    const fileRef = ref(this.storage, filePath);
    try {
      await uploadString(fileRef, JSON.stringify(req.body), 'raw', {
        contentType: 'application/json',
      });
      logger.info(`Stored raw request at ${filePath}`);
    } catch (error) {
      logger.error(`Failed to store raw request at ${filePath}: ${error}`);
    }
  }
}
