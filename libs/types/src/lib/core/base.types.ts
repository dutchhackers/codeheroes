export interface BaseDocument {
  id: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp;
}

// This interface isn't used yet
export interface TrackedDocument extends BaseDocument {
  lastModifiedBy?: string;
  version?: number;
}
