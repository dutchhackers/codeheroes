import { DocumentReference, Firestore } from 'firebase-admin/firestore';

/**
 * Discovers and reports the Firestore database schema.
 *
 * This is a sampling tool - it limits queries to avoid high read costs.
 * It samples up to 10 documents per collection to discover the schema structure.
 *
 * Usage:
 *   nx run database-seeds:discover-schema -c test
 *
 * This helps identify all collections and subcollections that need to be
 * handled by the progression resetter.
 */
export class SchemaDiscovery {
  // Limit for sampling queries to control Firestore read costs
  private readonly sampleLimit = 10;

  constructor(private db: Firestore) {}

  async discover(): Promise<void> {
    console.log('=== FIRESTORE SCHEMA DISCOVERY ===\n');
    console.log(`(Sampling up to ${this.sampleLimit} documents per collection)\n`);

    // Get all root collections
    const rootCollections = await this.db.listCollections();

    console.log('TOP-LEVEL COLLECTIONS:\n');
    for (const col of rootCollections) {
      // Use limit to avoid loading entire collections
      const snapshot = await col.limit(this.sampleLimit + 1).get();
      const hasMore = snapshot.size > this.sampleLimit;
      const displayCount = hasMore ? `${this.sampleLimit}+` : snapshot.size.toString();
      console.log(`  ${col.id}: ${displayCount} documents`);
    }

    // Discover user subcollections (sample first 10 users)
    console.log('\nUSER SUBCOLLECTIONS:\n');
    const usersSnapshot = await this.db.collection('users').limit(this.sampleLimit).get();
    const allSubcollections = new Map<string, number>();

    if (usersSnapshot.empty) {
      console.log('  (no users found)');
    } else {
      for (const userDoc of usersSnapshot.docs) {
        const subcollections = await userDoc.ref.listCollections();
        for (const sub of subcollections) {
          const count = allSubcollections.get(sub.id) || 0;
          allSubcollections.set(sub.id, count + 1);
        }
      }

      for (const [name, count] of [...allSubcollections.entries()].sort()) {
        console.log(`  users/{id}/${name} (found in ${count}/${usersSnapshot.size} sampled users)`);
      }
    }

    // Discover nested subcollections
    console.log(`\nNESTED SUBCOLLECTIONS (sampling ${this.sampleLimit} users):\n`);

    if (usersSnapshot.empty) {
      console.log('  (no users to sample)');
    } else {
      const nestedPaths = new Set<string>();

      for (const userDoc of usersSnapshot.docs) {
        await this.discoverNestedCollections(userDoc.ref, 'users/{id}', nestedPaths, 3);
      }

      if (nestedPaths.size === 0) {
        console.log('  (none found)');
      } else {
        for (const path of [...nestedPaths].sort()) {
          console.log(`  ${path}`);
        }
      }
    }

    // Summary
    console.log('\n=== RESET CONFIGURATION ===\n');
    console.log('PRESERVE:');
    console.log('  - system');
    console.log('  - users (documents only)');
    console.log('  - users/{id}/connectedAccounts');

    console.log('\nDELETE:');
    for (const col of rootCollections) {
      if (col.id !== 'users' && col.id !== 'system') {
        console.log(`  - ${col.id}`);
      }
    }
    for (const name of [...allSubcollections.keys()].sort()) {
      if (name !== 'connectedAccounts') {
        console.log(`  - users/{id}/${name}`);
      }
    }
  }

  /**
   * Recursively discovers nested subcollections.
   * Uses shallow limits to control Firestore read costs:
   * - Samples up to sampleLimit docs per collection
   * - Limits recursion depth
   */
  private async discoverNestedCollections(
    docRef: DocumentReference,
    pathPrefix: string,
    foundPaths: Set<string>,
    maxDepth: number,
  ): Promise<void> {
    if (maxDepth <= 0) return;

    const subcollections = await docRef.listCollections();

    for (const subcol of subcollections) {
      const subcolPath = `${pathPrefix}/${subcol.id}`;
      // Limit to sampleLimit docs to control read costs
      const snapshot = await subcol.limit(this.sampleLimit).get();

      for (const doc of snapshot.docs) {
        const nestedCols = await doc.ref.listCollections();

        for (const nested of nestedCols) {
          const nestedPath = `${subcolPath}/{docId}/${nested.id}`;
          foundPaths.add(nestedPath);

          // Recurse deeper with limited sampling
          const nestedDocs = await nested.limit(2).get();
          for (const nestedDoc of nestedDocs.docs) {
            await this.discoverNestedCollections(
              nestedDoc.ref,
              `${nestedPath}/{docId}`,
              foundPaths,
              maxDepth - 1,
            );
          }
        }
      }
    }
  }
}
