import * as express from "express";
// import { CharacterService } from "../../../libs/core/services/character-service";
// import { UserServiceV2 } from "../../../libs/core/services/user-service-v2";

const router = express.Router();

interface Request {
  userId?: string;
  characterId: string;
}

// Set Character for logged in user
router.put("/character", async (req, res) => {
  res.json({ message: req.path });


  // console.log("Set character for logged in user", JSON.stringify(req.body));
  // const passedRequest: Request = req.body as Request;

  // if (!passedRequest.characterId) {
  //   // Bad Request
  //   res.status(400);
  //   res.render("error", { error: "Bad Request 😪" });
  //   return;
  // }

  // console.log(`Get Character ${passedRequest.characterId}`);
  // const characterService = new CharacterService();
  // const character = await characterService.getCharacter(passedRequest.characterId);

  // const userId = passedRequest.userId;
  // if (userId) {
  //   console.log(`Get Character ${passedRequest.characterId}`);
  //   const userService = new UserServiceV2();
  //   await userService.setCharacter(userId, passedRequest.characterId);
  //   res.json(character);
  // } else {
  //   res.json(character);
  // }
});

export { router as UserController };
