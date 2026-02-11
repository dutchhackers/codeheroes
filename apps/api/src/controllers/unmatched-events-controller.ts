import { DatabaseInstance, logger, UnmatchedEventRepository } from '@codeheroes/common';
import { UnmatchedEventCategory, UnmatchedEventResolutionAction, UnmatchedEventStatus } from '@codeheroes/types';
import * as express from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';

const router = express.Router();

const CATEGORIES: readonly [UnmatchedEventCategory, ...UnmatchedEventCategory[]] = ['unknown_user', 'unlinked_repo'];
const STATUSES: readonly [UnmatchedEventStatus, ...UnmatchedEventStatus[]] = ['pending', 'resolved', 'dismissed'];
const RESOLUTION_ACTIONS: readonly [UnmatchedEventResolutionAction, ...UnmatchedEventResolutionAction[]] = [
  'created_user',
  'linked_to_user',
  'linked_to_project',
  'created_project',
];

const querySchema = z.object({
  category: z.enum(CATEGORIES),
  status: z.enum(STATUSES).optional(),
});

const resolveSchema = z.object({
  resolutionAction: z.enum(RESOLUTION_ACTIONS),
  resolutionTargetId: z.string().min(1),
});

// GET /unmatched-events/summary
router.get('/summary', async (req, res) => {
  logger.debug('GET /unmatched-events/summary');

  try {
    const repo = new UnmatchedEventRepository(DatabaseInstance.getInstance());
    const summary = await repo.getSummary();
    res.json(summary);
  } catch (error) {
    logger.error('Error fetching unmatched events summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// GET /unmatched-events
router.get('/', async (req, res) => {
  logger.debug('GET /unmatched-events', req.query);

  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid query parameters' });
      return;
    }

    const { category, status } = parsed.data;
    const repo = new UnmatchedEventRepository(DatabaseInstance.getInstance());
    const events = await repo.getByCategory(category, status);
    res.json(events);
  } catch (error) {
    logger.error('Error fetching unmatched events:', error);
    res.status(500).json({ error: 'Failed to fetch unmatched events' });
  }
});

// POST /unmatched-events/:id/resolve
router.post('/:id/resolve', validate(resolveSchema), async (req, res) => {
  const { id } = req.params;
  const { resolutionAction, resolutionTargetId } = req.body;
  logger.debug('POST /unmatched-events/:id/resolve', { id, resolutionAction });

  try {
    const repo = new UnmatchedEventRepository(DatabaseInstance.getInstance());

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Unmatched event not found' });
      return;
    }

    await repo.resolve(id, {
      resolvedBy: (req as any).user?.uid,
      resolutionAction,
      resolutionTargetId,
    });

    const updated = await repo.findById(id);
    res.json(updated);
  } catch (error) {
    logger.error('Error resolving unmatched event:', error);
    res.status(500).json({ error: 'Failed to resolve unmatched event' });
  }
});

// POST /unmatched-events/:id/dismiss
router.post('/:id/dismiss', async (req, res) => {
  const { id } = req.params;
  logger.debug('POST /unmatched-events/:id/dismiss', { id });

  try {
    const repo = new UnmatchedEventRepository(DatabaseInstance.getInstance());

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Unmatched event not found' });
      return;
    }

    await repo.dismiss(id);

    const updated = await repo.findById(id);
    res.json(updated);
  } catch (error) {
    logger.error('Error dismissing unmatched event:', error);
    res.status(500).json({ error: 'Failed to dismiss unmatched event' });
  }
});

export { router as UnmatchedEventsController };
