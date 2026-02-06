import { Request, Response } from 'express';
import { processWebhook } from '@codeheroes/integrations';

export async function processAzureWebhook(req: Request, res: Response): Promise<void> {
  return processWebhook({ req, res, provider: 'azure' });
}
