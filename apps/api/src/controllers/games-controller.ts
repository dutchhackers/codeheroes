import { logger } from "@codeheroes/common";
import * as express from "express";
// import { GameService } from "../../../libs/core/services/game-service";
// import { logger } from "../../../libs/core/utils";

const router = express.Router();

router.get("/:id?", async (req, res) => {
  logger.debug("Get games", req.params);

  res.json({ message: req.path });

  // const gamesService = new GameService();

  // const id = req.params.id;
  // if (!id) {
  //   const data = await gamesService.getGames();
  //   res.json({ data });
  // } else {
  //   res.json(await gamesService.getGame(id));
  // }
});

router.post("/:id/join", async (req, res) => {
  res.json({ message: req.path });

  // console.log("Join game", JSON.stringify(req.params));
  // res.json({ result: true });
});

export { router as GamesController };
