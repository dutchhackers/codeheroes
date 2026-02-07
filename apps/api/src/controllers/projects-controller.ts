import { DatabaseInstance, logger } from '@codeheroes/common';
import { ProjectRepository } from '@codeheroes/progression-engine';
import { CONNECTED_ACCOUNT_PROVIDERS, ProjectDetailDto, ProjectSummaryDto } from '@codeheroes/types';
import * as express from 'express';
import { z } from 'zod';
import { getTimePeriodIds } from '@codeheroes/progression-engine';
import { validate } from '../middleware/validate.middleware';

const router = express.Router();

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const repositorySchema = z.object({
  provider: z.enum(CONNECTED_ACCOUNT_PROVIDERS as unknown as [string, ...string[]]),
  owner: z.string().min(1),
  name: z.string().min(1),
  fullName: z.string().optional(),
});

const createProjectSchema = z.object({
  name: z.string().min(1).max(200).transform((v) => v.trim()),
  slug: z.string().regex(SLUG_PATTERN, 'slug must be lowercase alphanumeric with hyphens (e.g., "my-project")'),
  description: z.string().max(1000).optional().transform((v) => v?.trim()),
  repositories: z.array(repositorySchema).default([]),
}).strict();

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).transform((v) => v.trim()).optional(),
  description: z.string().max(1000).optional().transform((v) => v?.trim()),
  repositories: z.array(repositorySchema).optional(),
}).strict();

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
router.post('/', validate(createProjectSchema), async (req, res) => {
  logger.debug('POST /projects', req.body);

  try {
    const { name, slug, description, repositories } = req.body;

    // Derive fullName for each repository
    for (const r of repositories) {
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
      name,
      slug,
      description,
      repositories,
    });

    res.status(201).json(project);
  } catch (error) {
    logger.error('Error creating project', { error });
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /projects/:id — update project
router.put('/:id', validate(updateProjectSchema), async (req, res) => {
  logger.debug('PUT /projects/:id', { id: req.params.id, body: req.body });

  try {
    const { repositories, name, description } = req.body;

    // Derive fullName for repositories if provided
    if (repositories) {
      for (const r of repositories) {
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
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
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
