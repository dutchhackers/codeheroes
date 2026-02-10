export class BackfillNameMigration {
  async run(db: FirebaseFirestore.Firestore): Promise<void> {
    console.log('Starting name backfill migration...');

    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    console.log(`Found ${snapshot.size} user documents to process`);

    let updated = 0;
    let skipped = 0;
    const batchSize = 500;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Skip if name is already set
      if (data.name) {
        skipped++;
        continue;
      }

      const displayName = data.displayName;
      if (!displayName || typeof displayName !== 'string') {
        skipped++;
        continue;
      }

      batch.update(doc.ref, { name: displayName });
      batchCount++;
      updated++;

      if (batchCount >= batchSize) {
        await batch.commit();
        console.log(`  Committed batch of ${batchCount} updates (${updated} total)`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`Migration complete: ${updated} updated, ${skipped} skipped`);
  }
}
