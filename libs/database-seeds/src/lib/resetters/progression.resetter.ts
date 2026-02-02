import { DocumentReference, Firestore } from 'firebase-admin/firestore';

/**
 * Resets progression data while preserving user accounts.
 *
 * Clears:
 * - Top-level: gameActions, events, fcmTokens
 * - User subcollections: activities, activityStats (including nested daily/weekly records),
 *   stats, badges, notifications, achievements, rewards, weekendActivity
 *
 * Preserves:
 * - system collection
 * - users collection (user profiles)
 * - users/{id}/connectedAccounts subcollections (GitHub/Strava links)
 *
 * To discover the current schema, run:
 *   nx run database-seeds:discover-schema -c test
 */
export class ProgressionResetter {
  private batchSize = 500;

  async reset(db: Firestore): Promise<void> {
    console.log('Starting progression data reset...\n');

    // Clear top-level collections (preserves: system, users)
    await this.deleteCollection(db, 'gameActions');
    await this.deleteCollection(db, 'events');
    await this.deleteCollection(db, 'fcmTokens');

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

  /**
   * Recursively deletes a document and all its subcollections
   */
  private async deleteDocumentRecursively(docRef: DocumentReference): Promise<number> {
    let deleted = 0;

    // Get all subcollections of this document
    const subcollections = await docRef.listCollections();

    for (const subcollection of subcollections) {
      const snapshot = await subcollection.get();

      for (const doc of snapshot.docs) {
        // Recursively delete nested subcollections first
        deleted += await this.deleteDocumentRecursively(doc.ref);
        // Then delete the document itself
        await doc.ref.delete();
        deleted++;
      }
    }

    return deleted;
  }

  private async clearUserProgressionData(db: Firestore): Promise<void> {
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();

    if (usersSnapshot.empty) {
      console.log('  No users found');
      return;
    }

    console.log(`  Processing ${usersSnapshot.size} users...`);

    const subcollectionsToDelete = [
      'activities',
      'activityStats',
      'stats',
      'badges',
      'notifications',
      'achievements',
      'rewards',
      'weekendActivity',
    ];
    let totalDeleted = 0;

    for (const userDoc of usersSnapshot.docs) {
      // Delete all progression subcollections (recursively handles nested structures)
      for (const subcollection of subcollectionsToDelete) {
        const subcollectionRef = userDoc.ref.collection(subcollection);
        const subcollectionSnapshot = await subcollectionRef.get();

        for (const doc of subcollectionSnapshot.docs) {
          totalDeleted += await this.deleteDocumentRecursively(doc.ref);
          await doc.ref.delete();
          totalDeleted++;
        }
      }

      // Handle activityStats nested structure: activityStats/{periodType}/records/{recordId}
      // These may have "virtual" parent docs that don't appear in queries
      totalDeleted += await this.deleteActivityStats(userDoc.ref);
    }

    console.log(`  Deleted ${totalDeleted} documents from user subcollections`);
    console.log(`  Preserved ${usersSnapshot.size} users and their connectedAccounts`);
  }

  /**
   * Deletes activityStats subcollection with its nested daily/weekly records
   */
  private async deleteActivityStats(userRef: DocumentReference): Promise<number> {
    let deleted = 0;
    const periodTypes = ['daily', 'weekly'];

    for (const periodType of periodTypes) {
      const recordsRef = userRef
        .collection('activityStats')
        .doc(periodType)
        .collection('records');

      const recordsSnapshot = await recordsRef.get();

      for (const doc of recordsSnapshot.docs) {
        await doc.ref.delete();
        deleted++;
      }

      // Also delete the period type document itself if it exists
      const periodDoc = userRef.collection('activityStats').doc(periodType);
      const periodSnapshot = await periodDoc.get();
      if (periodSnapshot.exists) {
        await periodDoc.delete();
        deleted++;
      }
    }

    return deleted;
  }
}
