import { CollectionReference, DocumentReference, Firestore } from 'firebase-admin/firestore';

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

  /**
   * Deletes all documents in a collection using batched pagination.
   */
  private async deleteCollection(db: Firestore, collectionPath: string): Promise<void> {
    const collectionRef = db.collection(collectionPath);
    const deleted = await this.deleteCollectionBatched(collectionRef);
    console.log(`  Deleted ${deleted} documents from '${collectionPath}'`);
  }

  /**
   * Deletes all documents in a collection using batched pagination.
   * Handles large collections safely by processing in batches.
   */
  private async deleteCollectionBatched(collectionRef: CollectionReference): Promise<number> {
    let deleted = 0;
    let query = collectionRef.limit(this.batchSize);
    let snapshot = await query.get();

    while (!snapshot.empty) {
      for (const doc of snapshot.docs) {
        // Recursively delete any nested subcollections first
        deleted += await this.deleteDocumentRecursively(doc.ref);
        await doc.ref.delete();
        deleted++;
      }

      if (snapshot.size < this.batchSize) {
        break;
      }
      snapshot = await query.get();
    }

    return deleted;
  }

  /**
   * Recursively deletes all subcollections of a document.
   * Uses pagination to handle large subcollections safely.
   */
  private async deleteDocumentRecursively(docRef: DocumentReference): Promise<number> {
    let deleted = 0;

    // Get all subcollections of this document
    const subcollections = await docRef.listCollections();

    for (const subcollection of subcollections) {
      deleted += await this.deleteCollectionBatched(subcollection);
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

    // Note: activityStats is handled separately by deleteActivityStats() to handle nested structure
    const subcollectionsToDelete = [
      'activities',
      'stats',
      'badges',
      'notifications',
      'achievements',
      'rewards',
      'weekendActivity',
    ];
    let totalDeleted = 0;

    for (const userDoc of usersSnapshot.docs) {
      // Delete all progression subcollections using batched deletion
      for (const subcollection of subcollectionsToDelete) {
        const subcollectionRef = userDoc.ref.collection(subcollection);
        totalDeleted += await this.deleteCollectionBatched(subcollectionRef);
      }

      // Handle activityStats nested structure: activityStats/{periodType}/records/{recordId}
      // These may have "virtual" parent docs that don't appear in queries
      totalDeleted += await this.deleteActivityStats(userDoc.ref);
    }

    console.log(`  Deleted ${totalDeleted} documents from user subcollections`);
    console.log(`  Preserved ${usersSnapshot.size} users and their connectedAccounts`);
  }

  /**
   * Deletes activityStats subcollection with its nested period/records structure.
   * Dynamically discovers period types (daily, weekly, etc.) rather than hardcoding.
   * Uses batched deletion for records to handle large datasets safely.
   */
  private async deleteActivityStats(userRef: DocumentReference): Promise<number> {
    let deleted = 0;

    // Dynamically discover all period type documents (daily, weekly, monthly, etc.)
    const periodTypeDocs = await userRef.collection('activityStats').listDocuments();

    for (const periodDoc of periodTypeDocs) {
      // Delete records using batched deletion (handles large record sets)
      const recordsRef = periodDoc.collection('records');
      deleted += await this.deleteCollectionBatched(recordsRef);

      // Also delete the period type document itself if it exists
      const periodSnapshot = await periodDoc.get();
      if (periodSnapshot.exists) {
        await periodDoc.delete();
        deleted++;
      }
    }

    return deleted;
  }
}
