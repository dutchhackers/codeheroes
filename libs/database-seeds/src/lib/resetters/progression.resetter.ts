import { Firestore } from 'firebase-admin/firestore';

/**
 * Resets progression data while preserving user accounts.
 *
 * Clears:
 * - gameActions collection
 * - events collection
 * - users/{id}/activities subcollections
 * - users/{id}/activityStats subcollections
 * - users/{id}/stats subcollections
 * - users/{id}/badges subcollections
 * - users/{id}/notifications subcollections
 * - users/{id}/weekendActivity subcollections
 *
 * Preserves:
 * - users collection (user profiles)
 * - users/{id}/connectedAccounts subcollections (GitHub/Strava links)
 */
export class ProgressionResetter {
  private batchSize = 500;

  async reset(db: Firestore): Promise<void> {
    console.log('Starting progression data reset...\n');

    // Clear top-level collections
    await this.deleteCollection(db, 'gameActions');
    await this.deleteCollection(db, 'events');

    // Clear user subcollections (preserving users and connectedAccounts)
    await this.clearUserProgressionData(db);

    console.log('\n✅ Progression reset completed');
  }

  private async deleteCollection(db: Firestore, collectionPath: string): Promise<void> {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.limit(this.batchSize);

    let deleted = 0;
    let snapshot = await query.get();

    while (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      deleted += snapshot.size;

      if (snapshot.size < this.batchSize) {
        break;
      }
      snapshot = await query.get();
    }

    console.log(`  Deleted ${deleted} documents from '${collectionPath}'`);
  }

  private async clearUserProgressionData(db: Firestore): Promise<void> {
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();

    if (usersSnapshot.empty) {
      console.log('  No users found');
      return;
    }

    console.log(`  Processing ${usersSnapshot.size} users...`);

    const subcollectionsToDelete = ['activities', 'activityStats', 'stats', 'badges', 'notifications', 'weekendActivity'];
    let totalDeleted = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      for (const subcollection of subcollectionsToDelete) {
        const subcollectionRef = userDoc.ref.collection(subcollection);
        const subcollectionSnapshot = await subcollectionRef.get();

        if (!subcollectionSnapshot.empty) {
          const batch = db.batch();
          subcollectionSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          totalDeleted += subcollectionSnapshot.size;
        }
      }
    }

    console.log(`  Deleted ${totalDeleted} documents from user subcollections`);
    console.log(`  Preserved ${usersSnapshot.size} users and their connectedAccounts`);
  }
}
