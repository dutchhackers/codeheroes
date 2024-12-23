import * as express from 'express';
// import { UserServiceV2 } from "../../../libs/core/services/user-service-v2";

const router = express.Router();

router.get('/:id?', async (req, res) => {
  res.json({ message: req.path });

  // const userService = new UserServiceV2();
  // const id = req.params.id;
  // if (id) {
  //   res.json(await userService.getUser(id));
  // } else {
  //   res.json(await userService.getUsers());
  // }
});

export { router as UsersController };
