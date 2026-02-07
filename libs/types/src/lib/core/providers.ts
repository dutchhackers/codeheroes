export const CONNECTED_ACCOUNT_PROVIDERS = ['github', 'strava', 'azure', 'bitbucket_cloud', 'bitbucket_server', 'system'] as const;
export type ConnectedAccountProvider = (typeof CONNECTED_ACCOUNT_PROVIDERS)[number];

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
