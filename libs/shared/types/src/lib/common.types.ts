export interface BaseDocument {
  id: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp;
}

export type ConnectedAccountProvider = 'github' | 'strava' | 'azure' | 'bitbucket';
