export interface GitHubInstallation {
  id: string;
  githubInstallationId: number;
  appId: number;
  accountLogin: string;
  accountId: number;
  accountType: 'User' | 'Organization';
  repositorySelection: 'all' | 'selected';
  repositories: InstallationRepository[];
  permissions: Record<string, string>;
  events: string[];
  status: 'active' | 'suspended' | 'deleted';
  linkedUserId?: string;
  linkedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstallationRepository {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
}

export interface InstallationSetupDto {
  installationId: number;
  setupAction: 'install' | 'update' | 'request';
}

export interface InstallationSummaryDto {
  id: string;
  accountLogin: string;
  accountType: 'User' | 'Organization';
  repositorySelection: 'all' | 'selected';
  repositoryCount: number;
  repositories: InstallationRepository[];
  status: 'active' | 'suspended' | 'deleted';
  linkedUserId?: string;
  linkedAt?: string;
  createdAt: string;
}
