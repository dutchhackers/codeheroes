import { FieldValue } from 'firebase-admin/firestore';

export class ClearLastLoginMigration {
  async run(db: FirebaseFirestore.Firestore): Promise<void> {
    console.log('Starting clear-last-login migration...');

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('lastLogin', '==', '2024-01-01T00:00:00Z').get();

    console.log(`Found ${snapshot.size} users with bogus lastLogin value`);

    if (snapshot.empty) {
      console.log('Nothing to clear');
      return;
    }

    let cleared = 0;
    const batchSize = 500;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      batch.update(doc.ref, { lastLogin: FieldValue.delete() });
      batchCount++;
      cleared++;

      if (batchCount >= batchSize) {
        await batch.commit();
        console.log(`  Committed batch of ${batchCount} deletes (${cleared} total)`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`Migration complete: cleared lastLogin from ${cleared} users`);
  }
}
