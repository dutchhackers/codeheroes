import { Request, Response } from 'express';
import { processWebhook } from '@codeheroes/integrations';

export const App = async (req: Request, res: Response): Promise<void> => {
  // GitHub App webhooks include an `installation` object in the payload.
  // Use the app-specific secret for those, legacy secret for manual webhooks.
  const isAppWebhook = req.body?.installation != null;
  const secret = isAppWebhook
    ? process.env.GITHUB_APP_WEBHOOK_SECRET
    : process.env.WEBHOOK_SECRET;

  return processWebhook({
    req,
    res,
    provider: 'github',
    secret,
  });
};
