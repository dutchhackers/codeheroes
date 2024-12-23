import { logger } from "@codeheroes/common";
import * as express from "express";
// import { GameManagerService } from "../../../libs/core/services";
// import { logger } from "../../../libs/core/utils";

const router = express.Router();

router.get("/", async (req, res) => {
  logger.debug("Get current game", req.params);
  res.json({ message: req.path });

  // const gameManagerService = new GameManagerService();
  // res.json(await gameManagerService.getCurrentGame());
});

router.put("/start", async (req, res) => {
  res.json({ message: req.path });

  // const gameManagerService = new GameManagerService();
  // const response = gameManagerService.startNewGame();
  // res.json(response);
});

router.put("/stop", async (req, res) => {
  res.json({ message: req.path });
  // const gameManagerService = new GameManagerService();
  // await gameManagerService.stopCurrentGame();
  // res.sendStatus(200);
});

export { router as GameController };
