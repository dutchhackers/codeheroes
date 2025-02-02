import { logger, UserService } from '@codeheroes/common';
import * as express from 'express';
import { transformTo, transformArrayTo } from '../core/utils/transformer.utils';
import { UserDto } from '../core/dto/user.dto';

const router = express.Router();

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
  const params = {
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    startAfterId: req.query.startAfterId as string | undefined,
  };

  const users = await userService.getUsers(params);
  const transformedUsers = {
    ...users,
    items: transformArrayTo<UserDto>(UserDto, users.items),
  };

  res.json(transformedUsers);
});

router.post('/', async (req, res) => {
  logger.debug('POST /users', req.body);

  const userService = new UserService();
  res.json(await userService.createUser(req.body));
});

export { router as UsersController };
