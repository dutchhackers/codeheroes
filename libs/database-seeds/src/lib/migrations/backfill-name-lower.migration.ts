export class BackfillNameLowerMigration {
  async run(db: FirebaseFirestore.Firestore): Promise<void> {
    console.log('Starting nameLower backfill migration...');

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

      const name = data.name || data.displayName;
      if (!name || typeof name !== 'string') {
        skipped++;
        continue;
      }

      const updates: Record<string, string> = {};

      // Ensure name is set
      if (!data.name) {
        updates.name = name;
      }

      // Set nameLower
      updates.nameLower = name.toLowerCase();

      batch.update(doc.ref, updates);
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
