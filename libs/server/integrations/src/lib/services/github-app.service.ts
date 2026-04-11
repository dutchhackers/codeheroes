import { sign as jwtSign } from 'jsonwebtoken';
import { logger } from '@codeheroes/common';

interface InstallationAccessToken {
  token: string;
  expiresAt: string;
}

export class GitHubAppService {
  readonly #appId: string;
  readonly #privateKey: string;

  constructor() {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

    if (!appId || !privateKey) {
      throw new Error('GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY environment variables are required');
    }

    this.#appId = appId.trim();
    // Private key may be stored with escaped newlines in env vars
    this.#privateKey = privateKey.replace(/\\n/g, '\n').trim();
  }

  /**
   * Generate a JWT for authenticating as the GitHub App.
   * Valid for 10 minutes (GitHub maximum).
   */
  generateJwt(): string {
    const now = Math.floor(Date.now() / 1000);

    try {
      return jwtSign(
        {
          iat: now - 60, // 60 seconds in the past to account for clock drift
          exp: now + 600, // 10 minutes
          iss: this.#appId,
        },
        this.#privateKey,
        { algorithm: 'RS256' },
      );
    } catch (error: any) {
      logger.error('Failed to generate GitHub App JWT', {
        appId: this.#appId,
        keyLength: this.#privateKey?.length,
        keyStart: this.#privateKey?.substring(0, 30),
        errorMessage: error?.message,
      });
      throw error;
    }
  }

  /**
   * Get a short-lived installation access token for making API calls
   * on behalf of a specific installation.
   */
  async getInstallationAccessToken(installationId: number): Promise<InstallationAccessToken> {
    const appJwt = this.generateJwt();

    const response = await fetch(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${appJwt}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to get installation access token', { installationId, status: response.status, error });
      throw new Error(`Failed to get installation access token: ${response.status}`);
    }

    const data = await response.json();
    return {
      token: data.token,
      expiresAt: data.expires_at,
    };
  }

  /**
   * Get the list of repositories accessible to an installation.
   * Useful when the installation webhook hasn't arrived yet (race condition on setup).
   */
  async getInstallation(installationId: number): Promise<{
    id: number;
    account: { login: string; id: number; type: string };
    permissions: Record<string, string>;
    events: string[];
  }> {
    const appJwt = this.generateJwt();

    const response = await fetch(
      `https://api.github.com/app/installations/${installationId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${appJwt}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to get installation', { installationId, status: response.status, error });
      throw new Error(`Failed to get installation: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get repositories for an installation using an installation access token.
   */
  async getInstallationRepositories(installationId: number): Promise<
    Array<{ id: number; name: string; full_name: string; private: boolean }>
  > {
    const { token } = await this.getInstallationAccessToken(installationId);

    const response = await fetch('https://api.github.com/installation/repositories?per_page=100', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to get installation repositories', { installationId, status: response.status, error });
      throw new Error(`Failed to get installation repositories: ${response.status}`);
    }

    const data = await response.json();
    return data.repositories;
  }
}
