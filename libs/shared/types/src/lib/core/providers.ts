export type ConnectedAccountProvider = 'github' | 'strava' | 'azure' | 'bitbucket';

// ProviderConnection isn't in use yet
export interface ProviderConnection {
  provider: ConnectedAccountProvider;
  externalId: string;
  username: string;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}
