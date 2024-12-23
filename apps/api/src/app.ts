import cors from "cors";
import express from "express";

import { CharactersController } from "./controllers/characters-controller";
import { GameController } from "./controllers/game-controller";
import { GamesController } from "./controllers/games-controller";
import { ScoresController } from "./controllers/scores-controller";
import { UserController } from "./controllers/user-controller";
import { UsersController } from "./controllers/users-controller";

const app = express();

// Remove powered-by Express header
app.disable("x-powered-by");

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

app.use("/user", UserController);
app.use("/users", UsersController);
app.use("/characters", CharactersController);
app.use("/games", GamesController);
app.use("/game", GameController);
app.use("/scores", ScoresController);

export { app as defaultApi };
