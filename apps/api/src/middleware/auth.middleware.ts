import { logger } from '@codeheroes/common';
import { NextFunction, Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    logger.warn('Missing or malformed Authorization header');
    res.status(401).json({ message: 'Missing or invalid authorization token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    req.user = await getAuth().verifyIdToken(token);
    next();
  } catch (error) {
    logger.warn('Invalid Firebase ID token', { error });
    res.status(401).json({ message: 'Invalid or expired authorization token' });
  }
}
