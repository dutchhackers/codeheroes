import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { UserSeeder } from './lib/seeders/user.seeder';
import { ConnectedAccountSeeder } from './lib/seeders/connected-account.seeder';
import { SystemSeeder } from './lib/seeders/system.seeder';
import { ProjectSeeder } from './lib/seeders/project.seeder';
import { ProgressionResetter } from './lib/resetters/progression.resetter';
import { SchemaDiscovery } from './lib/discovery/schema.discovery';
import { LowercaseNamesMigration } from './lib/migrations/lowercase-names.migration';
import { BackfillNameMigration } from './lib/migrations/backfill-name.migration';
import { BackfillNameLowerMigration } from './lib/migrations/backfill-name-lower.migration';
import { ClearLastLoginMigration } from './lib/migrations/clear-last-login.migration';
import { SetAdminRoleMigration } from './lib/migrations/set-admin-role.migration';
import { BackfillCustomClaimsMigration } from './lib/migrations/backfill-custom-claims.migration';
import { loadJsonData } from './lib/utils/file-loader';

const VALID_COMMANDS = ['seed', 'reset-progression', 'discover-schema', 'backfill-lowercase-names', 'backfill-name', 'backfill-name-lower', 'backfill-custom-claims', 'clear-last-login', 'set-admin-role'] as const;
type Command = (typeof VALID_COMMANDS)[number];

function printUsage() {
  console.log(`
Usage: node main.js <command>

Commands:
  seed                       Seed the database with initial data (users, accounts, system)
  reset-progression          Reset all progression data (XP, levels, badges) while preserving users
  discover-schema            Discover and report the current Firestore schema
  backfill-lowercase-names   Backfill displayNameLower field on all user documents
  backfill-name              Backfill name field from displayName on all user documents
  backfill-name-lower        Backfill nameLower field (and ensure name is set) on all user documents
  backfill-custom-claims     Set customUserId claim on Firebase Auth for all users
  clear-last-login           Remove bogus lastLogin (2024-01-01) from seeded users
  set-admin-role <email>     Set admin role on a user by email (Firestore + Firebase Auth)

Environment Variables:
  FIREBASE_PROJECT_ID       Required. Firebase project ID (e.g., codeheroes-test)
  FIRESTORE_EMULATOR_HOST   Optional. If set, uses local emulator (e.g., localhost:8080)

Examples:
  nx seed database-seeds                              # Uses emulator (default)
  nx run database-seeds:reset-progression -c test     # Uses codeheroes-test
  nx run database-seeds:discover-schema -c test       # Uses codeheroes-test
`);
}

async function runSeed(db: FirebaseFirestore.Firestore) {
  const userSeeder = new UserSeeder();
  const connectedAccountSeeder = new ConnectedAccountSeeder();
  const systemSeeder = new SystemSeeder();
  const projectSeeder = new ProjectSeeder();

  // Seed system settings first
  const systemData = await loadJsonData<{ system: any[] }>('system.json');
  await systemSeeder.seed(db, systemData.system);

  // Seed users
  const userData = await loadJsonData<{ users: any[] }>('users.json');
  await userSeeder.seed(db, userData.users);

  // Seed connected accounts
  const accountData = await loadJsonData<{ connectedAccounts: any[] }>('connected-accounts.json');
  await connectedAccountSeeder.seed(db, accountData.connectedAccounts);

  // Seed projects
  const projectData = await loadJsonData<{ projects: any[] }>('projects.json');
  await projectSeeder.seed(db, projectData.projects);

  console.log('✅ Seeding completed');
}

async function runResetProgression(db: FirebaseFirestore.Firestore) {
  const resetter = new ProgressionResetter();
  await resetter.reset(db);
}

async function runDiscoverSchema(db: FirebaseFirestore.Firestore) {
  const discovery = new SchemaDiscovery(db);
  await discovery.discover();
}

async function runBackfillLowercaseNames(db: FirebaseFirestore.Firestore) {
  const migration = new LowercaseNamesMigration();
  await migration.run(db);
}

async function runBackfillName(db: FirebaseFirestore.Firestore) {
  const migration = new BackfillNameMigration();
  await migration.run(db);
}

async function runBackfillNameLower(db: FirebaseFirestore.Firestore) {
  const migration = new BackfillNameLowerMigration();
  await migration.run(db);
}

async function runClearLastLogin(db: FirebaseFirestore.Firestore) {
  const migration = new ClearLastLoginMigration();
  await migration.run(db);
}

async function main() {
  const arg = process.argv[2] || 'seed';

  if (arg === '--help' || arg === '-h') {
    printUsage();
    process.exit(0);
  }

  if (!VALID_COMMANDS.includes(arg as Command)) {
    console.error(`Unknown command: ${arg}`);
    printUsage();
    process.exit(1);
  }

  const command = arg as Command;

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
    switch (command) {
      case 'seed':
        await runSeed(db);
        break;
      case 'reset-progression':
        await runResetProgression(db);
        break;
      case 'discover-schema':
        await runDiscoverSchema(db);
        break;
      case 'backfill-lowercase-names':
        await runBackfillLowercaseNames(db);
        break;
      case 'backfill-name':
        await runBackfillName(db);
        break;
      case 'backfill-name-lower':
        await runBackfillNameLower(db);
        break;
      case 'backfill-custom-claims': {
        const claimsMigration = new BackfillCustomClaimsMigration();
        await claimsMigration.run(db);
        break;
      }
      case 'clear-last-login':
        await runClearLastLogin(db);
        break;
      case 'set-admin-role': {
        const email = process.argv[3];
        if (!email) {
          console.error('Usage: node main.js set-admin-role <email>');
          process.exit(1);
        }
        const migration = new SetAdminRoleMigration();
        await migration.run(db, email);
        break;
      }
    }
    process.exit(0);
  } catch (error) {
    console.error(`❌ Command '${command}' failed:`, error);
    process.exit(1);
  }
}

main();
