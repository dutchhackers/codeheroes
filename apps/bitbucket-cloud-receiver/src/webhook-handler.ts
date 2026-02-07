import { Request, Response } from 'express';
import { processWebhook } from '@codeheroes/integrations';

export async function processBitbucketCloudWebhook(req: Request, res: Response): Promise<void> {
  return processWebhook({
    req,
    res,
    provider: 'bitbucket_cloud',
    secret: process.env.WEBHOOK_SECRET,
  });
}
