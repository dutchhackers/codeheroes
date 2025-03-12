import cors from 'cors';
import express from 'express';
import admin from 'firebase-admin';

import { CharactersController } from './controllers/characters-controller';
import { GameController } from './controllers/game-controller';
import { GamesController } from './controllers/games-controller';
import { LeaderboardsController } from './controllers/leaderboards-controller';
import { ScoresController } from './controllers/scores-controller';
import { UserController } from './controllers/user-controller';
import { UsersController } from './controllers/users-controller';

const app = express();

admin.initializeApp();

// Remove powered-by Express header
app.disable('x-powered-by');

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

app.use('/user', UserController);
app.use('/users', UsersController);
app.use('/characters', CharactersController);
app.use('/games', GamesController);
app.use('/game', GameController);
app.use('/scores', ScoresController);
app.use('/leaderboards', LeaderboardsController);

export { app as defaultApi };
