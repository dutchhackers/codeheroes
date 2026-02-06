import { DatabaseInstance, logger } from '@codeheroes/common';
import { ProjectRepository } from '@codeheroes/progression-engine';
import { CONNECTED_ACCOUNT_PROVIDERS, ProjectDetailDto, ProjectSummaryDto } from '@codeheroes/types';
import * as express from 'express';
import { getTimePeriodIds } from '@codeheroes/progression-engine';

const router = express.Router();

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function getProjectRepository(): ProjectRepository {
  return new ProjectRepository(DatabaseInstance.getInstance());
}

// GET /projects — list all projects with summary stats
router.get('/', async (req, res) => {
  logger.debug('GET /projects');

  try {
    const repo = getProjectRepository();
    const projects = await repo.getAllProjects();

    const summaries: ProjectSummaryDto[] = await Promise.all(
      projects.map(async (project) => {
        const stats = await repo.getProjectStats(project.id);
        return {
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          repositoryCount: project.repositories.length,
          totalXp: stats?.totalXp ?? 0,
          totalActions: stats?.totalActions ?? 0,
          activeMemberCount: stats?.activeMembers?.length ?? 0,
          activeRepoCount: stats?.activeRepos?.length ?? 0,
        };
      }),
    );

    res.json(summaries);
  } catch (error) {
    logger.error('Error listing projects', { error });
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

// GET /projects/:id — project detail with full stats
router.get('/:id', async (req, res) => {
  logger.debug('GET /projects/:id', req.params);

  try {
    const repo = getProjectRepository();
    const project = await repo.getProject(req.params.id);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const stats = await repo.getProjectStats(project.id);
    const detail: ProjectDetailDto = {
      ...project,
      stats: stats ?? undefined,
    };

    res.json(detail);
  } catch (error) {
    logger.error('Error getting project', { error });
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// POST /projects — create project
router.post('/', async (req, res) => {
  logger.debug('POST /projects', req.body);

  try {
    const { name, slug, description, repositories = [] } = req.body;

    if (!name?.trim() || !slug) {
      res.status(400).json({ error: 'name and slug are required' });
      return;
    }

    if (!SLUG_PATTERN.test(slug)) {
      res.status(400).json({ error: 'slug must be lowercase alphanumeric with hyphens (e.g., "my-project")' });
      return;
    }

    // Validate repositories
    for (const r of repositories) {
      if (!r.provider || !r.owner || !r.name) {
        res.status(400).json({ error: 'Each repository must have provider, owner, and name' });
        return;
      }
      if (!CONNECTED_ACCOUNT_PROVIDERS.includes(r.provider)) {
        res.status(400).json({ error: `Invalid provider "${r.provider}". Must be one of: ${CONNECTED_ACCOUNT_PROVIDERS.join(', ')}` });
        return;
      }
      r.fullName = `${r.owner}/${r.name}`;
    }

    const repo = getProjectRepository();

    // Check for duplicate slug
    const existing = await repo.getProject(slug);
    if (existing) {
      res.status(409).json({ error: `Project with slug "${slug}" already exists` });
      return;
    }

    const project = await repo.createProject({
      name: name.trim(),
      slug,
      description: description?.trim(),
      repositories,
    });

    res.status(201).json(project);
  } catch (error) {
    logger.error('Error creating project', { error });
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /projects/:id — update project
router.put('/:id', async (req, res) => {
  logger.debug('PUT /projects/:id', { id: req.params.id, body: req.body });

  try {
    const { slug, repositories, name, description, ...rest } = req.body;

    // Reject unknown fields
    const unexpectedFields = Object.keys(rest);
    if (unexpectedFields.length > 0) {
      res.status(400).json({ error: `Unknown fields: ${unexpectedFields.join(', ')}. Allowed: name, description, repositories` });
      return;
    }

    // Slug cannot be changed (it is the document ID)
    if (slug !== undefined) {
      res.status(400).json({ error: 'slug cannot be updated (it is the document ID)' });
      return;
    }

    // Validate repositories if provided
    if (repositories) {
      for (const r of repositories) {
        if (!r.provider || !r.owner || !r.name) {
          res.status(400).json({ error: 'Each repository must have provider, owner, and name' });
          return;
        }
        if (!CONNECTED_ACCOUNT_PROVIDERS.includes(r.provider)) {
          res.status(400).json({ error: `Invalid provider "${r.provider}". Must be one of: ${CONNECTED_ACCOUNT_PROVIDERS.join(', ')}` });
          return;
        }
        r.fullName = `${r.owner}/${r.name}`;
      }
    }

    const repo = getProjectRepository();
    const existing = await repo.getProject(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      const trimmedName = name?.trim();
      if (!trimmedName) {
        res.status(400).json({ error: 'name cannot be empty' });
        return;
      }
      updateData.name = trimmedName;
    }
    if (description !== undefined) updateData.description = description?.trim();
    if (repositories !== undefined) updateData.repositories = repositories;

    await repo.updateProject(req.params.id, updateData);
    const updated = await repo.getProject(req.params.id);

    res.json(updated);
  } catch (error) {
    logger.error('Error updating project', { error });
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /projects/:id — delete project
router.delete('/:id', async (req, res) => {
  logger.debug('DELETE /projects/:id', req.params);

  try {
    const repo = getProjectRepository();
    const existing = await repo.getProject(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    await repo.deleteProject(req.params.id);

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting project', { error });
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// GET /projects/:id/stats/daily/:dayId? — daily stats (default: today)
router.get('/:id/stats/daily/:dayId?', async (req, res) => {
  logger.debug('GET /projects/:id/stats/daily', req.params);

  try {
    const repo = getProjectRepository();
    const project = await repo.getProject(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const dayId = req.params.dayId ?? getTimePeriodIds().daily;
    const stats = await repo.getProjectTimeBasedStats(req.params.id, 'daily', dayId);

    res.json(stats ?? { timeframeId: dayId, xpGained: 0, counters: { actions: {} }, activeMembers: [], activeRepos: [] });
  } catch (error) {
    logger.error('Error getting daily stats', { error });
    res.status(500).json({ error: 'Failed to get daily stats' });
  }
});

// GET /projects/:id/stats/weekly/:weekId? — weekly stats (default: current week)
router.get('/:id/stats/weekly/:weekId?', async (req, res) => {
  logger.debug('GET /projects/:id/stats/weekly', req.params);

  try {
    const repo = getProjectRepository();
    const project = await repo.getProject(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const weekId = req.params.weekId ?? getTimePeriodIds().weekly;
    const stats = await repo.getProjectTimeBasedStats(req.params.id, 'weekly', weekId);

    res.json(stats ?? { timeframeId: weekId, xpGained: 0, counters: { actions: {} }, activeMembers: [], activeRepos: [] });
  } catch (error) {
    logger.error('Error getting weekly stats', { error });
    res.status(500).json({ error: 'Failed to get weekly stats' });
  }
});

export { router as ProjectsController };
