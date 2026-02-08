import { Request, Response } from 'express';
import { processWebhook } from '@codeheroes/integrations';

export async function processBitbucketWebhook(req: Request, res: Response): Promise<void> {
  return processWebhook({
    req,
    res,
    provider: 'bitbucket',
    secret: process.env.WEBHOOK_SECRET,
  });
}
