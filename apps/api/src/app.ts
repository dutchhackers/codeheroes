import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';

import { CharactersController } from './controllers/characters-controller';
import { authMiddleware } from './middleware/auth.middleware';
import { GameController } from './controllers/game-controller';
import { GamesController } from './controllers/games-controller';
import { LeaderboardsController } from './controllers/leaderboards-controller';
import { NotificationsController } from './controllers/notifications-controller';
import { ProjectsController } from './controllers/projects-controller';
import { ScoresController } from './controllers/scores-controller';
import { UserController } from './controllers/user-controller';
import { UsersController } from './controllers/users-controller';

const app = express();

admin.initializeApp();

// Security headers
app.use(helmet());

// Remove powered-by Express header (also handled by helmet, but explicit)
app.disable('x-powered-by');

// Trust proxy — required for correct client IP behind Cloud Functions / load balancer
app.set('trust proxy', true);

// Request body size limit
app.use(express.json({ limit: '1mb' }));

// CORS — restrict to allowed origins when ALLOWED_ORIGINS is set,
// otherwise allow all origins (backward compatible default)
let allowedOrigins: string[] | null = null;

if (process.env.ALLOWED_ORIGINS !== undefined) {
  const parsedOrigins = process.env.ALLOWED_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  allowedOrigins = parsedOrigins.length > 0 ? parsedOrigins : null;
}

app.use(
  cors({
    origin: allowedOrigins
      ? (origin, callback) => {
          if (!origin || allowedOrigins!.includes(origin)) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        }
      : true,
  }),
);

// Rate limiting — 100 requests per 15 minutes per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  }),
);

// Require Firebase Auth for all routes
app.use(authMiddleware);

app.use('/user', UserController);
app.use('/users', UsersController);
app.use('/characters', CharactersController);
app.use('/games', GamesController);
app.use('/game', GameController);
app.use('/scores', ScoresController);
app.use('/leaderboards', LeaderboardsController);
app.use('/projects', ProjectsController);
app.use('/notifications', NotificationsController);

export { app as defaultApi };
