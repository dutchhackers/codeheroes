import express from 'express';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { ProjectsController } from './projects-controller';
import { UnmatchedEventsController } from './unmatched-events-controller';
import { UsersController } from './users-controller';

// Admin-only routes must reject a non-admin token before any handler logic
// (and therefore before any Firestore access) runs.
const ADMIN_ONLY_ROUTES: Array<[method: string, path: string]> = [
  ['GET', '/unmatched-events?category=unknown_user'],
  ['GET', '/unmatched-events/summary'],
  ['POST', '/unmatched-events/abc/resolve'],
  ['POST', '/unmatched-events/abc/dismiss'],
  ['POST', '/users'],
  ['POST', '/users/1/connected-accounts'],
  ['DELETE', '/users/1/connected-accounts/github_1'],
  ['POST', '/projects'],
  ['PUT', '/projects/p1'],
  ['DELETE', '/projects/p1'],
];

describe('admin-only API routes', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    // adminMiddleware logs every rejection; expected here
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const app = express();
    app.use(express.json());
    // Stand-in for authMiddleware: the role comes from a test header
    app.use((req, _res, next) => {
      req.user = { uid: 'test-uid', role: req.header('x-test-role') } as unknown as DecodedIdToken;
      next();
    });
    app.use('/unmatched-events', UnmatchedEventsController);
    app.use('/users', UsersController);
    app.use('/projects', ProjectsController);

    server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    jest.restoreAllMocks();
  });

  it.each(ADMIN_ONLY_ROUTES)('%s %s returns 403 for a non-admin user', async (method, path) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'content-type': 'application/json', 'x-test-role': 'user' },
      body: method === 'GET' || method === 'DELETE' ? undefined : '{}',
    });

    expect(res.status).toBe(403);
  });
});
