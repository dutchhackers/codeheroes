import * as express from 'express';
import { z } from 'zod';
import { DatabaseInstance, logger } from '@codeheroes/common';
import { InstallationRepository } from '@codeheroes/common';
import { GitHubAppService } from '@codeheroes/integrations';
import { InstallationSummaryDto } from '@codeheroes/types';
import { validate } from '../middleware/validate.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = express.Router();

const setupSchema = z.object({
  installationId: z.number().int().positive(),
  setupAction: z.enum(['install', 'update', 'request']),
});

/**
 * POST /installations/setup
 * Called after GitHub redirects back to the PWA with installation_id.
 * Links the GitHub App installation to the current user.
 */
router.post('/setup', validate(setupSchema), async (req, res) => {
  const { installationId, setupAction } = req.body;
  const userId = req.user?.customUserId;

  if (!userId) {
    res.status(401).json({ error: 'User identity not found' });
    return;
  }

  logger.debug('POST /installations/setup', { installationId, setupAction, userId });

  try {
    const repo = new InstallationRepository(DatabaseInstance.getInstance());
    let installation = await repo.findByGithubInstallationId(installationId);

    // Race condition: webhook may not have arrived yet.
    // Fetch installation details from GitHub API and create the record.
    if (!installation) {
      try {
        const appService = new GitHubAppService();
        const [ghInstallation, ghRepos] = await Promise.all([
          appService.getInstallation(installationId),
          appService.getInstallationRepositories(installationId),
        ]);

        installation = await repo.create(
          {
            githubInstallationId: installationId,
            appId: ghInstallation.id,
            accountLogin: ghInstallation.account.login,
            accountId: ghInstallation.account.id,
            accountType: ghInstallation.account.type === 'Organization' ? 'Organization' : 'User',
            repositories: ghRepos.map((r) => ({
              id: r.id,
              name: r.name,
              fullName: r.full_name,
              private: r.private,
            })),
            permissions: ghInstallation.permissions,
            events: ghInstallation.events,
            status: 'active',
            linkedUserId: userId,
          },
          String(installationId),
        );

        res.status(201).json(toSummary(installation));
        return;
      } catch (fetchError) {
        logger.error('Failed to fetch installation from GitHub', { installationId, error: fetchError });
        res.status(404).json({ error: 'Installation not found. Please try again in a moment.' });
        return;
      }
    }

    // Already linked to another user
    if (installation.linkedUserId && installation.linkedUserId !== userId) {
      res.status(409).json({ error: 'This installation is already linked to another account' });
      return;
    }

    // Link to current user
    if (!installation.linkedUserId) {
      await repo.linkToUser(installation.id, userId);
      installation.linkedUserId = userId;
    }

    res.json(toSummary(installation));
  } catch (error) {
    logger.error('Error setting up installation:', error);
    res.status(500).json({ error: 'Failed to set up installation' });
  }
});

/**
 * GET /installations
 * List current user's linked installations.
 */
router.get('/', async (req, res) => {
  const userId = req.user?.customUserId;

  if (!userId) {
    res.status(401).json({ error: 'User identity not found' });
    return;
  }

  logger.debug('GET /installations', { userId });

  try {
    const repo = new InstallationRepository(DatabaseInstance.getInstance());
    const installations = await repo.findByLinkedUserId(userId);

    res.json(installations.map(toSummary));
  } catch (error) {
    logger.error('Error listing installations:', error);
    res.status(500).json({ error: 'Failed to list installations' });
  }
});

/**
 * GET /installations/:id
 * Get installation detail (owner or admin).
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.customUserId;
  const isAdmin = req.user?.role === 'admin';

  logger.debug('GET /installations/:id', { id, userId });

  try {
    const repo = new InstallationRepository(DatabaseInstance.getInstance());
    const installation = await repo.findById(id);

    if (!installation) {
      res.status(404).json({ error: 'Installation not found' });
      return;
    }

    if (!isAdmin && installation.linkedUserId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(installation);
  } catch (error) {
    logger.error('Error getting installation:', error);
    res.status(500).json({ error: 'Failed to get installation' });
  }
});

/**
 * DELETE /installations/:id
 * Unlink installation from current user.
 * Does NOT uninstall the GitHub App — that's done on GitHub.
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.customUserId;

  if (!userId) {
    res.status(401).json({ error: 'User identity not found' });
    return;
  }

  logger.debug('DELETE /installations/:id', { id, userId });

  try {
    const repo = new InstallationRepository(DatabaseInstance.getInstance());
    const installation = await repo.findById(id);

    if (!installation) {
      res.status(404).json({ error: 'Installation not found' });
      return;
    }

    if (installation.linkedUserId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await repo.unlinkUser(id);
    res.status(204).send();
  } catch (error) {
    logger.error('Error unlinking installation:', error);
    res.status(500).json({ error: 'Failed to unlink installation' });
  }
});

/**
 * GET /installations/admin/all
 * Admin overview of all installations.
 */
router.get('/admin/all', adminMiddleware, async (req, res) => {
  logger.debug('GET /installations/admin/all');

  try {
    const repo = new InstallationRepository(DatabaseInstance.getInstance());
    const installations = await repo.findAll(500);

    res.json(installations.map(toSummary));
  } catch (error) {
    logger.error('Error listing all installations:', error);
    res.status(500).json({ error: 'Failed to list installations' });
  }
});

function toSummary(installation: any): InstallationSummaryDto {
  return {
    id: installation.id,
    accountLogin: installation.accountLogin,
    accountType: installation.accountType,
    repositoryCount: installation.repositories?.length ?? 0,
    repositories: installation.repositories ?? [],
    status: installation.status,
    linkedUserId: installation.linkedUserId,
    linkedAt: installation.linkedAt,
    createdAt: installation.createdAt,
  };
}

export { router as InstallationsController };
