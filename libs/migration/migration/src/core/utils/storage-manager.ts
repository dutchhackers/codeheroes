interface IStorageManager {
  saveRequest(req): Promise<void>;
}

export class StorageManager implements IStorageManager {
  constructor() {
    //
  }

  saveRequest(req: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
