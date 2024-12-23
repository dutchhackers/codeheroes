import { logger, UserServiceV2 } from '@codeheroes/migration';
import * as express from 'express';

const router = express.Router();

router.get('/:id?', async (req, res) => {
  logger.debug('GET /users/:id', req.params);

  const userService = new UserServiceV2();
  const id = req.params.id;
  if (id) {
    res.json(await userService.getUser(id));
  } else {
    res.json(await userService.getUsers());
  }
});

export { router as UsersController };
