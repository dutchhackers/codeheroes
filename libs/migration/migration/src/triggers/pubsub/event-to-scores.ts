import { IPubSubEvent } from '../../core/interfaces';
import { IExternalEvent } from '../../core/models/external-event';
import { UserServiceV2 } from '../../core/services/user-service-v2';
import { calculateXpData } from '../../helpers/xp-helper';

const userService = new UserServiceV2();

export async function eventToGameScores(event: IPubSubEvent) {
  console.log('[eventToScores] Sent external event to Cloud Firestore');

  const data = event.data.message.json as IExternalEvent;

  const xpData = await calculateXpData(data);
  console.log('calculatedXpData', xpData);
  const scoreData = await calculateScoreData(event); // Not available yet

  // process XP and Scores
  // IMPROVEMENT: refactor into Promise.all(...)
  for (const userTotals of xpData.getXpTotalsPerUser()) {
    console.log('[INFO] [eventToGameScores]', userTotals.uid, userTotals.totalXp, userTotals.userXpItems);
    await userService.saveUserXpData(userTotals.uid, userTotals.totalXp, userTotals.userXpItems);
  }
}

async function calculateScoreData(event: any): Promise<any> {
  console.log('[calculateScoreData]', JSON.stringify(event));
}
