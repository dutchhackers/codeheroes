import { DocumentReference, Firestore } from 'firebase-admin/firestore';

/**
 * Resets progression data while preserving user accounts.
 *
 * Clears:
 * - gameActions collection
 * - events collection
 * - users/{id}/activities subcollections
 * - users/{id}/activityStats subcollections (including nested daily/weekly records)
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

    const subcollectionsToDelete = ['activities', 'stats', 'badges', 'notifications', 'weekendActivity'];
    let totalDeleted = 0;

    for (const userDoc of usersSnapshot.docs) {
      // Delete simple subcollections
      for (const subcollection of subcollectionsToDelete) {
        const subcollectionRef = userDoc.ref.collection(subcollection);
        const subcollectionSnapshot = await subcollectionRef.get();

        for (const doc of subcollectionSnapshot.docs) {
          totalDeleted += await this.deleteDocumentRecursively(doc.ref);
          await doc.ref.delete();
          totalDeleted++;
        }
      }

      // Delete activityStats with nested structure: activityStats/{periodType}/records/{recordId}
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
