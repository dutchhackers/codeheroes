import { ConnectedAccountProvider } from '@codeheroes/common';

export interface Repository {
  id: string;
  name: string;
  owner: string;
  ref?: string; // branch/tag reference
}

export interface CommitDetails {
  id: string;
  message: string;
  timestamp: string;
  author: {
    name: string;
    email: string;
  };
}

export interface BaseContext {
  type: string;
  provider: ConnectedAccountProvider;
}
