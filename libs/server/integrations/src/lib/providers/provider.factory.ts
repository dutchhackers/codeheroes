import { ProviderAdapter } from './interfaces/provider.interface';
import { GitHubAdapter } from './github/github.adapter';
import { AzureDevOpsProviderAdapter } from './azure-devops/adapter';

/**
 * Factory for creating provider adapters
 */
export class ProviderFactory {
  private static providers: Map<string, ProviderAdapter> = new Map();

  /**
   * Initializes available providers
   */
  static initialize(): void {
    // Register GitHub provider
    const githubAdapter = new GitHubAdapter();
    this.providers.set(githubAdapter.providerName, githubAdapter);

    // Register Azure DevOps provider
    const azureDevOpsAdapter = new AzureDevOpsProviderAdapter();
    this.providers.set(azureDevOpsAdapter.providerName, azureDevOpsAdapter);

    // Register other providers as they become available
    // this.providers.set('bitbucket', new BitbucketAdapter());
  }

  /**
   * Gets a provider adapter by name
   * @param providerName Name of the provider
   * @returns Provider adapter instance
   */
  static getProvider(providerName: string): ProviderAdapter {
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`Provider adapter not found for: ${providerName}`);
    }

    return provider;
  }

  /**
   * Checks if a provider is supported
   * @param providerName Name of the provider to check
   * @returns True if provider is supported
   */
  static supportsProvider(providerName: string): boolean {
    return this.providers.has(providerName);
  }
}

// Initialize providers
ProviderFactory.initialize();
