import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export class CounterService {
  private db = getFirestore();
  private counterRef = this.db.collection('system').doc('counters');

  /**
   * Generates the next sequential user ID
   * @param startAt - Starting value for user IDs (defaults to 10000000)
   * @returns Promise<string> - Returns an 8-digit user ID as a string
   * @example
   * const userId = await getNextUserId(); // returns "10000000"
   * const nextUserId = await getNextUserId(); // returns "10000001"
   */
  async getNextUserId(startAt = 10000000): Promise<string> {
    return this.db.runTransaction(async (transaction) => {
      const doc = await transaction.get(this.counterRef);
      const currentId = doc.exists ? doc.data()?.nextUserId || startAt : startAt;
      
      transaction.set(this.counterRef, {
        nextUserId: currentId + 1,
        updatedAt: Timestamp.now()
      }, { merge: true });

      return currentId.toString();
    });
  }
}