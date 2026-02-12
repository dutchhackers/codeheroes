import { logger } from '@codeheroes/common';
import { NextFunction, Request, Response } from 'express';

export async function adminMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = req.user;

  if (!user) {
    logger.warn('Admin middleware: no authenticated user');
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (user.role !== 'admin') {
    logger.warn('Admin middleware: user lacks admin role', { uid: user.uid });
    res.status(403).json({ message: 'Forbidden: admin role required' });
    return;
  }

  next();
}
