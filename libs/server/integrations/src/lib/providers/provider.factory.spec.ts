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

  it('should throw error for unsupported provider', () => {
    expect(() => ProviderFactory.getProvider('unsupported')).toThrow();
  });
});
