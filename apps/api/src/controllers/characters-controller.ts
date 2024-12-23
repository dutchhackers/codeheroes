import * as express from "express";
// import { CharacterService } from "../../../libs/core/services/character-service";

const router = express.Router();

router.get("/:id?", async (req, res) => {
  res.json({ message: req.path });
  // const characterService = new CharacterService();
  // const id = req.params.id;
  // if (id) {
  //   res.json(await characterService.getCharacter(id));
  // } else {
  //   const characters = await characterService.getCharacters();
  //   for (const item of characters as any[]) {
  //     delete item.teamRef;
  //   }
  //   res.json(characters);
  // }
});

export { router as CharactersController };
