import { logger } from "@codeheroes/common";
import * as express from "express";
// import { ScoresService } from "../../../libs/core/services/scores-service";
// import { ICreateScore } from "../../../libs/core/interfaces";

const router = express.Router();

router.post("/", async (req, res) => {
  logger.debug("Create Score", req.body);
  res.json({ message: req.path });

  // const scoresService = new ScoresService();

  // const createScoreInput = req.body as ICreateScore;

  // const response = await scoresService.createScore({ ...createScoreInput, time: new Date().toISOString() });
  // res.json(response);
});

export { router as ScoresController };
