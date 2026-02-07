import { Request, Response } from 'express';
import { processWebhook } from '@codeheroes/integrations';

export const App = async (req: Request, res: Response): Promise<void> => {
  return processWebhook({
    req,
    res,
    provider: 'github',
    secret: process.env.WEBHOOK_SECRET,
  });
};
