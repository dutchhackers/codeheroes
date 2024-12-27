import { CharacterService } from '@codeheroes/migration';
import * as express from 'express';

const router = express.Router();

router.get('/:id?', async (req, res) => {
  const characterService = new CharacterService();
  const id = req.params.id;
  if (id) {
    res.json(await characterService.getCharacter(id));
  } else {
    const characters = await characterService.getCharacters();
    for (const item of characters as any[]) {
      delete item.teamRef;
    }
    res.json(characters);
  }
});

export { router as CharactersController };
