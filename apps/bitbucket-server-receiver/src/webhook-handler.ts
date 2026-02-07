import { Request, Response } from 'express';
import { processWebhook } from '@codeheroes/integrations';

export async function processBitbucketServerWebhook(req: Request, res: Response): Promise<void> {
  return processWebhook({
    req,
    res,
    provider: 'bitbucket_server',
    secret: process.env.WEBHOOK_SECRET,
  });
}
