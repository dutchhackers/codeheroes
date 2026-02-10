import { getCurrentTimeAsISO, logger, UserService } from '@codeheroes/common';
import { Collections, CONNECTED_ACCOUNT_PROVIDERS } from '@codeheroes/types';
import * as express from 'express';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ConnectedAccountDto } from '../core/dto/connected-account.dto';
import { UserDto } from '../core/dto/user.dto';
import { transformArrayTo, transformTo } from '../core/utils/transformer.utils';
import { validate } from '../middleware/validate.middleware';

const router = express.Router();

const createUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(100).optional(),
  active: z.boolean().optional(),
  userType: z.enum(['user', 'bot', 'system']).optional(),
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

router.patch('/:id', validate(updateUserSchema), async (req, res) => {
  logger.debug('PATCH /users/:id', { id: req.params.id, body: req.body });

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

export { router as UsersController };
