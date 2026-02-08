import { ProviderFactory } from './provider.factory';
describe('ProviderFactory', () => {
  it('should initialize providers', () => {
    expect(ProviderFactory.supportsProvider('github')).toBe(true);
  });
  it('should get GitHub provider', () => {
    const provider = ProviderFactory.getProvider('github');
    expect(provider).toBeDefined();
    expect(provider.providerName).toBe('github');
  });
  it('should support and get Azure DevOps provider', () => {
    expect(ProviderFactory.supportsProvider('azure')).toBe(true);
    const provider = ProviderFactory.getProvider('azure');
    expect(provider).toBeDefined();
    expect(provider.providerName).toBe('azure');
  });
  it('should support and get Bitbucket provider', () => {
    expect(ProviderFactory.supportsProvider('bitbucket')).toBe(true);
    const provider = ProviderFactory.getProvider('bitbucket');
    expect(provider).toBeDefined();
    expect(provider.providerName).toBe('bitbucket');
  });
  it('should throw error for unsupported provider', () => {
    expect(() => ProviderFactory.getProvider('unsupported')).toThrow();
  });
});
