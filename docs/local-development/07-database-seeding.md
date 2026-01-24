# Database Seeding

This guide provides detailed documentation about database seeding, data flow, and how different collections are populated.

## Overview

CodeHeroes uses a two-tier data initialization approach:

1. **Seeded Data** - Created by running the database seeder (users, connected accounts)
2. **Auto-Created Data** - Generated automatically when processing activities (progression state, activity records)

## Running the Seeder

```bash
# Ensure emulators are running first
nx serve firebase-app

# Run the seeder
FIREBASE_PROJECT_ID=your-project-id nx seed database-seeds
```

## What Gets Seeded

The seeder creates the foundational data required for the system to function:

### Users Collection (`users`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | User ID (e.g., "1000002") |
| `uid` | string | Firebase Auth UID (nullable) |
| `email` | string | User email |
| `displayName` | string | Display name |
| `photoUrl` | string | Avatar URL |
| `userType` | string | "user" or "bot" |
| `active` | boolean | Account active status |
| `createdAt` | string | ISO timestamp |
| `updatedAt` | string | ISO timestamp |

### Connected Accounts (`users/{id}/connectedAccounts`)

| Field | Type | Description |
|-------|------|-------------|
| `provider` | string | "github", "strava", etc. |
| `externalUserId` | string | Provider's user ID |
| `externalUserName` | string | Provider's username |
| `createdAt` | string | ISO timestamp |
| `updatedAt` | string | ISO timestamp |

**Document ID format:** `{provider}_{externalUserId}` (e.g., `github_7045335`)

## What Is NOT Seeded (Auto-Created)

These collections are created automatically when activities are processed:

### Progression State (`users/{id}/stats/current`)

Created on first activity for a user.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | User ID |
| `xp` | number | Total XP earned |
| `level` | number | Current level |
| `currentLevelXp` | number | XP progress in current level |
| `xpToNextLevel` | number | XP needed for next level |
| `lastActivityDate` | string | Date of last activity (YYYY-MM-DD) |
| `counters` | map | Activity counters |
| `counters.actions` | map | Per-action-type counts |
| `achievements` | array | Earned achievement IDs |
| `createdAt` | string | ISO timestamp |
| `updatedAt` | string | ISO timestamp |

**Counter Actions:**
- `code_push`
- `pull_request_create`, `pull_request_merge`, `pull_request_close`
- `code_review_submit`, `code_review_comment`
- `issue_create`, `issue_close`, `issue_reopen`
- `workout_complete`, `distance_milestone`, `speed_record`

### Activities (`users/{id}/activities`)

Created for each processed activity.

### Activity Stats (`users/{id}/activityStats`)

Daily and weekly aggregated statistics.

### Game Actions (`gameActions`)

Raw game actions created from webhook events.

### Events (`events`)

Processed webhook events.

## Data Flow: GitHub Webhook to Progression

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. GitHub sends webhook with sender.id = "7045335"                 │
└────────────────────────────────────┬────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. gitHubReceiver looks up connected account                       │
│     Query: connectedAccounts where externalUserId == "7045335"      │
│     Result: users/1000002/connectedAccounts/github_7045335          │
│     → User ID: 1000002                                              │
└────────────────────────────────────┬────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. Creates gameAction document in gameActions collection           │
│     { type: "code_push", userId: "1000002", ... }                   │
└────────────────────────────────────┬────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. processGameAction (Firestore trigger) processes the action      │
│     - Calculates XP (e.g., 120 for code_push)                       │
│     - Gets or creates progression state                             │
└────────────────────────────────────┬────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. ProgressionRepository.updateState()                             │
│     - If no stats/current exists → createInitialState()             │
│     - Updates XP, level, counters                                   │
│     - Writes to users/1000002/stats/current                         │
└────────────────────────────────────┬────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  6. Pub/Sub events published                                        │
│     - progression.activity.recorded                                 │
│     - progression.xp.gained                                         │
│     - (if level up) progression.level.up                            │
└─────────────────────────────────────────────────────────────────────┘
```

## Automatic Progression State Creation

When a user's first activity is processed, the system automatically creates their progression state:

```typescript
// In ProgressionRepository.updateState():
if (!statsDoc.exists) {
  const initialState = await this.createInitialState(userId);
  return this.updateState(userId, update, activity);
}
```

**Initial State Values:**
- `xp`: 0
- `level`: 1
- `currentLevelXp`: 0
- `xpToNextLevel`: 1000
- `counters.actions.*`: 0 (all counters)
- `achievements`: []

This means you do NOT need to seed progression state - it's created automatically on first activity.

## Seed Data Files

The seeder uses local override files when they exist:

| File | Description |
|------|-------------|
| `libs/database-seeds/src/lib/data/users.json` | Base user data |
| `libs/database-seeds/src/lib/data/users.local.json` | Local override (team-specific) |
| `libs/database-seeds/src/lib/data/connected-accounts.json` | Base connected accounts |
| `libs/database-seeds/src/lib/data/connected-accounts.local.json` | Local override (GitHub IDs) |

The `.local.json` files are automatically used if they exist (not committed to git).

## Testing the Data Flow

### 1. Clear and Reseed

```bash
# Open Firestore UI
open http://localhost:4000/firestore

# Click "Clear all data" button

# Run seeder
FIREBASE_PROJECT_ID=your-project-id nx seed database-seeds
```

### 2. Verify Seeded Data

Check that `users` collection has documents with `connectedAccounts` subcollections.

### 3. Trigger a Webhook

```bash
# In the codeheroes-support repo
cd /path/to/codeheroes-support
git commit --allow-empty -m "Test webhook"
git push
```

### 4. Verify Processing

```bash
# Check ngrok received the webhook
curl -s http://127.0.0.1:4040/api/requests/http | python3 -c "
import sys,json
for r in json.load(sys.stdin).get('requests',[])[:3]:
    print(f\"{r['request']['method']} {r['request']['uri']} -> {r['response']['status']}\")"
```

### 5. Verify Data Created

In Firestore UI, check:
- `users/{userId}/stats/current` - Progression state created
- `users/{userId}/activities` - Activity recorded
- `gameActions` - Game action document

## Troubleshooting

### "User not found" Error

**Cause:** No connected account mapping for the GitHub user ID.

**Solution:**
1. Check `connected-accounts.local.json` has the GitHub user ID
2. Re-run the seeder

### "Cannot read properties of undefined (reading 'code_push')"

**Cause:** Legacy data with old schema missing `counters.actions`.

**Solution:** Clear Firestore and re-seed, or manually add the missing structure.

### Progression State Not Created

**Cause:** User lookup failed (no connected account).

**Debug:**
1. Check webhook sender ID in ngrok inspector
2. Verify connected account exists with that external ID
3. Check emulator logs for "User ID found" message

## Key User Mappings (Local)

| Display Name | User ID | GitHub ID | GitHub Username |
|--------------|---------|-----------|-----------------|
| Nightcrawler | 1000002 | 7045335 | mschilling |

(See `connected-accounts.local.json` for full list)
