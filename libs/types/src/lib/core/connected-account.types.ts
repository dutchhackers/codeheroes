import { ConnectedAccountProvider } from './providers';

export interface ConnectedAccountDto {
  id: string;
  provider: ConnectedAccountProvider;
  externalUserId: string;
  externalUserName?: string;
  createdAt: string;
}
