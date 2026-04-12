import { InstallationRepository } from '@codeheroes/common';
import { GitHubInstallation, InstallationRepository as InstallationRepo } from '@codeheroes/types';
import { DatabaseInstance, logger } from '@codeheroes/common';

export class InstallationEventHandler {
  readonly #repo: InstallationRepository;

  constructor() {
    this.#repo = new InstallationRepository(DatabaseInstance.getInstance());
  }

  async handle(eventType: string, payload: any): Promise<void> {
    if (eventType === 'installation') {
      await this.#handleInstallation(payload);
    } else if (eventType === 'installation_repositories') {
      await this.#handleInstallationRepositories(payload);
    } else {
      logger.warn('Unknown installation event type', { eventType });
    }
  }

  async #handleInstallation(payload: any): Promise<void> {
    const { action, installation, repositories } = payload;
    const installationId = String(installation.id);

    logger.info('Handling installation event', { action, installationId: installation.id, account: installation.account?.login });

    switch (action) {
      case 'created': {
        const repos: InstallationRepo[] = (repositories || []).map(this.#mapRepository);

        const data: Omit<GitHubInstallation, 'id' | 'createdAt' | 'updatedAt'> = {
          githubInstallationId: installation.id,
          appId: installation.app_id,
          accountLogin: installation.account.login,
          accountId: installation.account.id,
          accountType: installation.account.type === 'Organization' ? 'Organization' : 'User',
          repositories: repos,
          permissions: installation.permissions || {},
          events: installation.events || [],
          status: 'active',
        };

        // Idempotent: if doc already exists (race with /installations/setup), merge without overwriting linkedUserId
        const existing = await this.#repo.findById(installationId);
        if (existing) {
          await this.#repo.update(installationId, {
            repositories: repos,
            permissions: installation.permissions || {},
            events: installation.events || [],
            status: 'active',
          } as Partial<GitHubInstallation>);
          logger.info('Installation created event merged into existing doc', { installationId, account: installation.account.login, repoCount: repos.length });
        } else {
          await this.#repo.create(data, installationId);
          logger.info('Installation created', { installationId, account: installation.account.login, repoCount: repos.length });
        }
        break;
      }

      case 'deleted': {
        const existing = await this.#repo.findById(installationId);
        if (existing) {
          await this.#repo.updateStatus(installationId, 'deleted');
          if (existing.linkedUserId) {
            await this.#repo.unlinkUser(installationId);
          }
          logger.info('Installation deleted', { installationId });
        }
        break;
      }

      case 'suspend': {
        await this.#updateStatusIfExists(installationId, 'suspended');
        break;
      }

      case 'unsuspend': {
        await this.#updateStatusIfExists(installationId, 'active');
        break;
      }

      default:
        logger.info('Unhandled installation action', { action, installationId });
    }
  }

  async #handleInstallationRepositories(payload: any): Promise<void> {
    const { action, installation, repositories_added, repositories_removed } = payload;
    const installationId = String(installation.id);

    logger.info('Handling installation_repositories event', { action, installationId: installation.id });

    const existing = await this.#repo.findById(installationId);
    if (!existing) {
      logger.warn('Installation not found for repository update', { installationId });
      return;
    }

    let updatedRepos = [...existing.repositories];

    if (action === 'added' && repositories_added) {
      const newRepos: InstallationRepo[] = repositories_added.map(this.#mapRepository);
      // De-duplicate by repo ID to handle webhook retries
      const reposById = new Map(updatedRepos.map((r) => [r.id, r]));
      for (const repo of newRepos) {
        reposById.set(repo.id, repo);
      }
      updatedRepos = Array.from(reposById.values());
    }

    if (action === 'removed' && repositories_removed) {
      const removedIds = new Set(repositories_removed.map((r: any) => r.id));
      updatedRepos = updatedRepos.filter((r) => !removedIds.has(r.id));
    }

    await this.#repo.updateRepositories(installationId, updatedRepos);
    logger.info('Installation repositories updated', { installationId, repoCount: updatedRepos.length });
  }

  async #updateStatusIfExists(installationId: string, status: GitHubInstallation['status']): Promise<void> {
    const existing = await this.#repo.findById(installationId);
    if (existing) {
      await this.#repo.updateStatus(installationId, status);
      logger.info(`Installation ${status}`, { installationId });
    }
  }

  #mapRepository(repo: any): InstallationRepo {
    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private ?? false,
    };
  }
}
