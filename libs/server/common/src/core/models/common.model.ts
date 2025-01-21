export type ConnectedAccountProvider = 'github' | 'strava' | 'azure' | 'bitbucket';

export interface BaseDocument {
  id: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
