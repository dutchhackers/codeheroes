import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { UserSeeder } from './lib/seeders/user.seeder';
import { ConnectedAccountSeeder } from './lib/seeders/connected-account.seeder';
import { SystemSeeder } from './lib/seeders/system.seeder';
import { loadJsonData } from './lib/utils/file-loader';

async function main() {
  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID environment variable is not set');
  }

  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });

  const db = getFirestore();

  // Configure Firestore to use emulator
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('Using Firestore Emulator:', process.env.FIRESTORE_EMULATOR_HOST);
    db.settings({
      host: process.env.FIRESTORE_EMULATOR_HOST,
      ssl: false,
    });
  } else {
    console.log('Using remote Firestore project:', process.env.FIREBASE_PROJECT_ID);
  }

  try {
    const userSeeder = new UserSeeder();
    const connectedAccountSeeder = new ConnectedAccountSeeder();
    const systemSeeder = new SystemSeeder();

    // Seed system settings first
    const systemData = await loadJsonData<{ system: any[] }>('system.json');
    await systemSeeder.seed(db, systemData.system);

    // Seed users
    const userData = await loadJsonData<{ users: any[] }>('users.json');
    await userSeeder.seed(db, userData.users);

    // Seed connected accounts
    const accountData = await loadJsonData<{ connectedAccounts: any[] }>('connected-accounts.json');
    await connectedAccountSeeder.seed(db, accountData.connectedAccounts);

    console.log('✅ Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
