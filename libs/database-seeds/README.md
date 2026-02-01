# database-seeds

Seeds Firestore with test data for local development and testing.

## Usage

```bash
# Seed local emulator
FIREBASE_PROJECT_ID=your-project-id nx seed database-seeds

# Seed test environment (use with caution!)
FIREBASE_PROJECT_ID=codeheroes-app-test nx seed database-seeds
```

## Data Files

- `users.local.json` - User profiles
- `connected-accounts.local.json` - GitHub account mappings

## Important Notes

### Seeding Production/Test Environments

**WARNING:** Running the seeder against production or test environments will overwrite existing user documents. This can cause issues:

- User documents in seed data do NOT include the `uid` field (Firebase Auth UID)
- The `uid` is set by the `onBeforeUserCreated` trigger when users first sign up
- If you seed over existing users, their `uid` will be removed
- Users will see "Profile not found" until they sign in again (the `onBeforeUserSignIn` trigger now re-syncs the `uid`)

**Recommendations:**
1. Only seed local emulators, not shared environments
2. If you must seed test/prod, warn users they may need to re-login
3. Consider adding `uid` fields to seed data for known test users

### TODO: Improve Seed Data

Future improvement: Add `uid` placeholder fields to seed data that can be populated with actual Firebase Auth UIDs for test environments. This would prevent the uid-wipe issue when seeding.
