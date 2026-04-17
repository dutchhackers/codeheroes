import { logger, SettingsService } from '@codeheroes/common';
import * as express from 'express';

const router = express.Router();

// GET /system/options — public options for dropdowns (authenticated users only)
router.get('/options', async (_req, res) => {
  try {
    const settingsService = new SettingsService();
    const options = await settingsService.getOptions();
    res.json(options);
  } catch (error) {
    logger.error('Error fetching system options:', error);
    res.status(500).json({ error: 'Failed to fetch system options' });
  }
});

export { router as SystemController };
