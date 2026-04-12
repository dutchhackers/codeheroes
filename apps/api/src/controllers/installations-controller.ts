import * as express from 'express';
import { z } from 'zod';
import { DatabaseInstance, logger } from '@codeheroes/common';
import { InstallationRepository } from '@codeheroes/common';
import { GitHubAppService } from '@codeheroes/integrations';
import { BadgeService } from '@codeheroes/progression-engine';
import { Collections, GitHubInstallation, InstallationSummaryDto } from '@codeheroes/types';
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
      let ghInstallation;
      let ghRepos;

      try {
        const appService = new GitHubAppService();
        [ghInstallation, ghRepos] = await Promise.all([
          appService.getInstallation(installationId),
          appService.getInstallationRepositories(installationId),
        ]);
      } catch (fetchError: any) {
        const status = fetchError?.message?.includes('401') || fetchError?.message?.includes('403') ? 500 : 404;
        logger.error('Failed to fetch installation from GitHub', {
          installationId,
          errorMessage: fetchError?.message,
        });
        res.status(status).json({
          error: status === 500
            ? 'GitHub App configuration error. Please contact support.'
            : 'Installation not found. Please try again in a moment.',
        });
        return;
      }

      // Verify ownership: the user's GitHub account must match the installation's account
      const ownershipValid = await verifyInstallationOwnership(userId, ghInstallation.account.login, ghInstallation.account.type);
      if (!ownershipValid) {
        logger.warn('Installation ownership verification failed', { userId, accountLogin: ghInstallation.account.login });
        res.status(403).json({ error: 'You do not have permission to link this installation' });
        return;
      }

      installation = await repo.create(
        {
          githubInstallationId: installationId,
          appId: ghInstallation.app_id,
          accountLogin: ghInstallation.account.login,
          accountId: ghInstallation.account.id,
          accountType: ghInstallation.account.type === 'Organization' ? 'Organization' : 'User',
          repositorySelection: ghInstallation.repository_selection === 'all' ? 'all' : 'selected',
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
          linkedAt: new Date().toISOString(),
        },
        String(installationId),
      );

      // Grant onboarding badges based on total linked repos
      grantInstallationBadges(userId, repo).catch((err) =>
        logger.warn('Failed to grant installation badges', { userId, error: err?.message }),
      );

      res.status(201).json(toSummary(installation));
      return;
    }

    // Already linked to another user
    if (installation.linkedUserId && installation.linkedUserId !== userId) {
      res.status(409).json({ error: 'This installation is already linked to another account' });
      return;
    }

    // Link to current user
    if (!installation.linkedUserId) {
      // Verify ownership before linking existing installation
      const ownershipValid = await verifyInstallationOwnership(userId, installation.accountLogin, installation.accountType);
      if (!ownershipValid) {
        logger.warn('Installation ownership verification failed', { userId, accountLogin: installation.accountLogin });
        res.status(403).json({ error: 'You do not have permission to link this installation' });
        return;
      }

      await repo.linkToUser(installation.id, userId);
      installation.linkedUserId = userId;

      // Grant onboarding badges based on total linked repos
      grantInstallationBadges(userId, repo).catch((err) =>
        logger.warn('Failed to grant installation badges', { userId, error: err?.message }),
      );
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

function toSummary(installation: GitHubInstallation): InstallationSummaryDto {
  return {
    id: installation.id,
    accountLogin: installation.accountLogin,
    accountType: installation.accountType,
    repositorySelection: installation.repositorySelection ?? 'selected',
    repositoryCount: installation.repositories?.length ?? 0,
    repositories: installation.repositories ?? [],
    status: installation.status,
    linkedUserId: installation.linkedUserId,
    linkedAt: installation.linkedAt,
    createdAt: installation.createdAt,
  };
}

/**
 * Verify that the user has permission to link this installation.
 * For personal installs (User): GitHub username must match the installation account.
 * For org installs (Organization): GitHub enforces org admin during install flow,
 * so we only require that the user has a GitHub connected account.
 */
async function verifyInstallationOwnership(userId: string, accountLogin: string, accountType?: string): Promise<boolean> {
  const db = DatabaseInstance.getInstance();
  const snapshot = await db
    .collection(Collections.Users)
    .doc(userId)
    .collection(Collections.ConnectedAccounts)
    .where('provider', '==', 'github')
    .limit(1)
    .get();

  if (snapshot.empty) {
    logger.warn('User has no GitHub connected account', { userId });
    return false;
  }

  // For personal accounts, verify the GitHub username matches
  if (accountType === 'User') {
    const connectedAccount = snapshot.docs[0].data();
    if (connectedAccount.externalUserName?.toLowerCase() !== accountLogin.toLowerCase()) {
      logger.warn('GitHub username does not match installation account', {
        userId,
        userGitHub: connectedAccount.externalUserName,
        installationAccount: accountLogin,
      });
      return false;
    }
  }

  return true;
}

/**
 * Grant onboarding badges based on total repos linked via GitHub App installations.
 */
async function grantInstallationBadges(userId: string, repo: InstanceType<typeof InstallationRepository>): Promise<void> {
  const badgeService = new BadgeService();
  const installations = await repo.findByLinkedUserId(userId);
  const totalRepos = installations.reduce((sum, inst) => sum + (inst.repositories?.length ?? 0), 0);

  await badgeService.grantBadge(userId, 'connected');

  if (totalRepos >= 5) {
    await badgeService.grantBadge(userId, 'fleet_commander');
  }
  if (totalRepos >= 10) {
    await badgeService.grantBadge(userId, 'mission_control');
  }
}

export { router as InstallationsController };
