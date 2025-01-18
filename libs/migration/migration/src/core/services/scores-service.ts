import { ICreateScore } from '../interfaces';
import { logger } from '../utils';
import { CoreService } from './abstract-service';

const SCORE_COLLECTION = 'scores';

export interface IScoresService {
  createScore(options?: any): Promise<any>;
}

export class ScoresService extends CoreService implements IScoresService {
  constructor() {
    super();
  }
  async createScore(createScore: ICreateScore, options?: any): Promise<any> {
    logger.debug('Create Score', createScore, options);

    // Validate score
    if (!createScore || !createScore.score) {
      logger.error(`[SCORES] [ERROR] [Input validation error = ${JSON.stringify(createScore)}]`);
    }

    try {
      logger.info(
        `[SCORES] [pushScore ${createScore.score}] [${createScore.eventType}] [game=${createScore.game}, team=${createScore.team}, player=${createScore.player}, time=${createScore.time}]`
      );
      const scoreRef = this.db.collection(SCORE_COLLECTION);
      await scoreRef.doc().create(createScore);

      return createScore;
    } catch (e) {
      logger.error('Error in pushScore', e);
    }
  }
}
