import { UserService } from '@codeheroes/common';
import { logger } from '@codeheroes/migration';
import * as express from 'express';
import { transformTo } from '../core/utils/transformer.utils';
import { UserDto } from '../core/dto/user.dto';

const router = express.Router();

// router.get('/:id?', async (req, res) => {
//   logger.debug('GET /users/:id', req.params);

//   const userService = new UserServiceV2();
//   const id = req.params.id;
//   if (id) {
//     res.json(await userService.getUser(id));
//   } else {
//     res.json(await userService.getUsers());
//   }
// });

// implement GET /users/:id
//     // return transformTo<UserDto>(UserDto, snapshot.data());
router.get('/:id', async (req, res) => {
  logger.debug('GET /users/:id', req.params);

  const userService = new UserService();
  const user = await userService.getUser(req.params.id);
  res.json(transformTo<UserDto>(UserDto, user));
});

router.post('/', async (req, res) => {
  logger.debug('POST /users', req.body);

  const userService = new UserService();
  res.json(await userService.createUser(req.body));
});

export { router as UsersController };
