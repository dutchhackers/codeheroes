import { createSign } from 'crypto';
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
      const header = { alg: 'RS256', typ: 'JWT' };
      const payload = {
        iat: now - 60,
        exp: now + 600,
        iss: this.#appId,
      };

      const encode = (obj: object) =>
        Buffer.from(JSON.stringify(obj)).toString('base64url');

      const headerB64 = encode(header);
      const payloadB64 = encode(payload);
      const signingInput = `${headerB64}.${payloadB64}`;

      const signer = createSign('RSA-SHA256');
      signer.update(signingInput);
      const signature = signer.sign(this.#privateKey, 'base64url');

      return `${signingInput}.${signature}`;
    } catch (error: any) {
      logger.error('Failed to generate GitHub App JWT', {
        appId: this.#appId,
        keyLength: this.#privateKey?.length,
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
    app_id: number;
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
    const perPage = 100;
    const maxPages = 50;
    let page = 1;
    const repositories: Array<{ id: number; name: string; full_name: string; private: boolean }> = [];

    while (page <= maxPages) {
      const response = await fetch(
        `https://api.github.com/installation/repositories?per_page=${perPage}&page=${page}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error('Failed to get installation repositories', { installationId, page, status: response.status, error });
        throw new Error(`Failed to get installation repositories: ${response.status}`);
      }

      const data: { total_count?: number; repositories: Array<{ id: number; name: string; full_name: string; private: boolean }> } =
        await response.json();
      repositories.push(...data.repositories);

      if (data.repositories.length < perPage || (typeof data.total_count === 'number' && repositories.length >= data.total_count)) {
        break;
      }
      page += 1;
    }

    if (page > maxPages) {
      logger.warn('Reached pagination cap for installation repositories', { installationId, fetched: repositories.length, maxPages });
    }

    return repositories;
  }
}
