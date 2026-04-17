import { getCurrentTimeAsISO, logger, UserService } from '@codeheroes/common';
import { Collections, CONNECTED_ACCOUNT_PROVIDERS, DEFAULT_DAILY_GOAL } from '@codeheroes/types';
import * as express from 'express';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ConnectedAccountDto } from '../core/dto/connected-account.dto';
import { UserDto } from '../core/dto/user.dto';
import { transformArrayTo, transformTo } from '../core/utils/transformer.utils';
import { validate } from '../middleware/validate.middleware';

const router = express.Router();

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
});

const dimensionsSchema = z
  .object({
    studio: z.string().min(1).max(64).nullable().optional(),
    discipline: z.string().min(1).max(64).nullable().optional(),
  })
  .strict();

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(100).optional(),
  active: z.boolean().optional(),
  userType: z.enum(['user', 'bot', 'system']).optional(),
  photoUrl: z.string().url().max(500).nullable().optional(),
  dimensions: dimensionsSchema.optional(),
});

const addConnectedAccountSchema = z.object({
  provider: z.enum(CONNECTED_ACCOUNT_PROVIDERS).refine((p) => p !== 'system', { message: 'Provider "system" is not allowed for connected accounts' }),
  externalUserId: z.string().min(1).refine((val) => !val.includes('/'), { message: 'External user ID must not contain "/"' }),
  externalUserName: z.string().optional(),
});

// implement GET /users/:id
router.get('/:id', async (req, res) => {
  logger.debug('GET /users/:id', req.params);

  const userService = new UserService();
  const user = await userService.getUser(req.params.id);
  res.json(transformTo<UserDto>(UserDto, user));
});

// implement GET /users
router.get('/', async (req, res) => {
  logger.debug('GET /users', req.query);

  const userService = new UserService();
  const sortDirectionRaw = req.query.sortDirection as string | undefined;
  const sortDirection: 'asc' | 'desc' | undefined =
    sortDirectionRaw === 'asc' || sortDirectionRaw === 'desc'
      ? sortDirectionRaw
      : undefined;

  const params = {
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    startAfterId: req.query.startAfterId as string | undefined,
    sortBy: req.query.sortBy as string | undefined,
    sortDirection,
    search: req.query.search as string | undefined,
    userType: req.query.userType as string | undefined,
  };

  const users = await userService.getUsers(params);
  const transformedUsers = {
    ...users,
    items: transformArrayTo<UserDto>(UserDto, users.items),
  };

  res.json(transformedUsers);
});

router.post('/', validate(createUserSchema), async (req, res) => {
  logger.debug('POST /users', req.body);

  const userService = new UserService();
  res.json(await userService.createUser(req.body));
});

// Admin-only fields — users may only modify their own displayName/dimensions/photoUrl.
const SELF_EDITABLE_FIELDS = new Set(['displayName', 'dimensions', 'photoUrl']);

router.patch('/:id', validate(updateUserSchema), async (req, res) => {
  logger.debug('PATCH /users/:id', { id: req.params.id, body: req.body });

  const isAdmin = req.user?.role === 'admin';
  const isSelf = req.user?.customUserId === req.params.id;

  if (!isAdmin && !isSelf) {
    res.status(403).json({ error: 'Forbidden: admin role or self-edit required' });
    return;
  }

  if (!isAdmin) {
    const requestedKeys = Object.keys(req.body);
    const hasDisallowedKey = requestedKeys.some((key) => !SELF_EDITABLE_FIELDS.has(key));
    if (hasDisallowedKey) {
      res.status(403).json({ error: 'Forbidden: admin role required to modify these fields' });
      return;
    }
  }

  const userService = new UserService();
  const updated = await userService.updateUser(req.params.id, req.body);
  res.json(transformTo<UserDto>(UserDto, updated));
});

// --- Connected Accounts ---

router.get('/:userId/connected-accounts', async (req, res) => {
  const { userId } = req.params;
  logger.debug('GET /users/:userId/connected-accounts', { userId });

  try {
    const db = getFirestore();
    const userDoc = await db.collection(Collections.Users).doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const snapshot = await db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.ConnectedAccounts)
      .get();

    const accounts = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      };
    });

    res.json(transformArrayTo<ConnectedAccountDto>(ConnectedAccountDto, accounts));
  } catch (error) {
    logger.error('Error fetching connected accounts:', error);
    res.status(500).json({ error: 'Failed to fetch connected accounts' });
  }
});

/**
 * POST /users/:userId/connect-github
 * Exchange a GitHub OAuth code for user info and create a connected account.
 */
router.post('/:userId/connect-github', async (req, res) => {
  const { userId } = req.params;
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ error: 'Missing code' });
    return;
  }

  // Verify the requesting user matches the target userId
  if (req.user?.customUserId !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  logger.debug('POST /users/:userId/connect-github', { userId });

  try {
    const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      logger.error('GITHUB_OAUTH_CLIENT_ID or GITHUB_OAUTH_CLIENT_SECRET not configured');
      res.status(500).json({ error: 'GitHub OAuth not configured' });
      return;
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });

    if (!tokenResponse.ok) {
      logger.error('GitHub OAuth token exchange HTTP error', { status: tokenResponse.status });
      res.status(502).json({ error: 'GitHub authorization failed' });
      return;
    }

    const tokenData = await tokenResponse.json();
    if (tokenData.error || !tokenData.access_token) {
      logger.error('GitHub OAuth token exchange failed', { error: tokenData.error });
      res.status(400).json({ error: tokenData.error_description || 'GitHub authorization failed' });
      return;
    }

    // Get GitHub user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json' },
    });

    if (!userResponse.ok) {
      res.status(502).json({ error: 'Failed to fetch GitHub user profile' });
      return;
    }

    const ghUser = await userResponse.json();
    const externalUserId = String(ghUser.id);
    const externalUserName = ghUser.login;

    // Verify user exists
    const db = getFirestore();
    const userDoc = await db.collection(Collections.Users).doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Create connected account
    const docId = `github_${externalUserId}`;
    const now = getCurrentTimeAsISO();

    const accountRef = db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.ConnectedAccounts)
      .doc(docId);

    try {
      await accountRef.create({
        provider: 'github',
        externalUserId,
        externalUserName,
        createdAt: now,
        updatedAt: now,
      });
    } catch (createError: any) {
      if (createError?.code === 6 || createError?.code === 'already-exists') {
        res.json({ message: 'GitHub account already connected', externalUserName });
        return;
      }
      throw createError;
    }

    logger.info('GitHub account connected', { userId, githubId: externalUserId, githubLogin: externalUserName });
    res.status(201).json({ message: 'GitHub account connected', externalUserName });
  } catch (error) {
    logger.error('Error connecting GitHub account:', error);
    res.status(500).json({ error: 'Failed to connect GitHub account' });
  }
});

router.post('/:userId/connected-accounts', validate(addConnectedAccountSchema), async (req, res) => {
  const { userId } = req.params;
  const { provider, externalUserId, externalUserName } = req.body;
  logger.debug('POST /users/:userId/connected-accounts', { userId, provider, externalUserId });

  try {
    const db = getFirestore();
    const userDoc = await db.collection(Collections.Users).doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const docId = `${provider}_${externalUserId}`;
    const now = getCurrentTimeAsISO();
    const data: Record<string, string> = {
      provider,
      externalUserId,
      createdAt: now,
      updatedAt: now,
    };
    if (externalUserName) {
      data.externalUserName = externalUserName;
    }

    const accountRef = db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.ConnectedAccounts)
      .doc(docId);

    try {
      await accountRef.create(data);
    } catch (createError: any) {
      if (createError?.code === 6 || createError?.code === 'already-exists') {
        res.status(409).json({ error: 'Connected account already exists' });
        return;
      }
      throw createError;
    }

    const result = { id: docId, ...data };
    res.status(201).json(transformTo<ConnectedAccountDto>(ConnectedAccountDto, result));
  } catch (error) {
    logger.error('Error adding connected account:', error);
    res.status(500).json({ error: 'Failed to add connected account' });
  }
});

router.delete('/:userId/connected-accounts/:accountId', async (req, res) => {
  const { userId, accountId } = req.params;
  logger.debug('DELETE /users/:userId/connected-accounts/:accountId', { userId, accountId });

  try {
    const db = getFirestore();
    const userDoc = await db.collection(Collections.Users).doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const accountRef = db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.ConnectedAccounts)
      .doc(accountId);

    const accountDoc = await accountRef.get();
    if (!accountDoc.exists) {
      res.status(404).json({ error: 'Connected account not found' });
      return;
    }

    await accountRef.delete();
    res.status(204).send();
  } catch (error) {
    logger.error('Error removing connected account:', error);
    res.status(500).json({ error: 'Failed to remove connected account' });
  }
});

// --- User Settings ---

const updateSettingsSchema = z.object({
  dailyGoal: z.number().int().min(1000).max(100000).optional(),
  notificationsEnabled: z.boolean().optional(),
  onboardingDismissed: z.boolean().optional(),
});

router.get('/:userId/settings', async (req, res) => {
  const { userId } = req.params;
  logger.debug('GET /users/:userId/settings', { userId });

  try {
    const db = getFirestore();
    const userDoc = await db.collection(Collections.Users).doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const settingsDoc = await db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Settings)
      .doc('preferences')
      .get();

    if (!settingsDoc.exists) {
      res.json({
        userId,
        dailyGoal: DEFAULT_DAILY_GOAL,
        notificationsEnabled: true,
        updatedAt: getCurrentTimeAsISO(),
      });
      return;
    }

    res.json({ userId, ...settingsDoc.data() });
  } catch (error) {
    logger.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
});

router.patch('/:userId/settings', validate(updateSettingsSchema), async (req, res) => {
  const { userId } = req.params;
  logger.debug('PATCH /users/:userId/settings', { userId, body: req.body });

  try {
    const db = getFirestore();
    const userDoc = await db.collection(Collections.Users).doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const settingsRef = db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Settings)
      .doc('preferences');

    const updates = {
      ...req.body,
      userId,
      updatedAt: getCurrentTimeAsISO(),
    };

    await settingsRef.set(updates, { merge: true });

    const updated = await settingsRef.get();
    res.json({ userId, ...updated.data() });
  } catch (error) {
    logger.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

export { router as UsersController };
