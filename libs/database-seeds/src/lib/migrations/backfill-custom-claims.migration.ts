import { getAuth } from 'firebase-admin/auth';

export class BackfillCustomClaimsMigration {
  async run(db: FirebaseFirestore.Firestore): Promise<void> {
    console.log('Starting customUserId claim backfill...');

    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    console.log(`Found ${snapshot.size} user documents to process`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const auth = getAuth();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const customUserId = doc.id;
      const authUid = data.uid;

      if (!authUid) {
        console.log(`  Skipping ${customUserId} — no Firebase Auth UID`);
        skipped++;
        continue;
      }

      try {
        const userRecord = await auth.getUser(authUid);
        const existingClaims = userRecord.customClaims || {};

        if (existingClaims.customUserId === customUserId) {
          skipped++;
          continue;
        }

        await auth.setCustomUserClaims(authUid, { ...existingClaims, customUserId });
        console.log(`  Set customUserId=${customUserId} for UID ${authUid}`);
        updated++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`  Failed for ${customUserId} (UID ${authUid}): ${message}`);
        failed++;
      }
    }

    console.log(`Backfill complete: ${updated} updated, ${skipped} skipped, ${failed} failed`);
    if (updated > 0) {
      console.log('Note: Users must sign out and sign back in for new claims to take effect.');
    }
  }
}
