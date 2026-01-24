# Running Locally

This guide covers starting the backend emulators and web application.

## Quick Start

**Start the complete backend with a single command:**

```bash
nx serve firebase-app
```

This is the only command you need. Do NOT try to start individual functions separately.

## What `nx serve firebase-app` Does

The `firebase-app` is the orchestrator for all backend services. Running serve triggers this sequence:

```
┌─────────────────────────────────────────────────────────────────┐
│  nx serve firebase-app                                          │
├─────────────────────────────────────────────────────────────────┤
│  1. killports          → Clear all emulator ports               │
│  2. nx run-many build  → Build all 4 function codebases         │
│      ├── api                                                    │
│      ├── auth-service                                           │
│      ├── game-engine                                            │
│      └── github-receiver                                        │
│  3. firebase emulators:start                                    │
│      ├── Auth         :9099                                     │
│      ├── Functions    :5001                                     │
│      ├── Firestore    :8080                                     │
│      ├── Storage      :9199                                     │
│      ├── Pub/Sub      :8085                                     │
│      ├── Eventarc     :9299                                     │
│      └── UI           :4000                                     │
│  4. Watch mode active  → Rebuilds on changes                    │
└─────────────────────────────────────────────────────────────────┘
```

## Port Allocations

| Service | Port | URL |
|---------|------|-----|
| Emulator UI | 4000 | http://localhost:4000 |
| Functions | 5001 | http://localhost:5001 |
| Firestore | 8080 | http://localhost:8080 |
| Auth | 9099 | http://localhost:9099 |
| Storage | 9199 | http://localhost:9199 |
| Pub/Sub | 8085 | http://localhost:8085 |
| Eventarc | 9299 | http://localhost:9299 |

## Function Endpoints

The four function codebases expose these HTTP endpoints:

| Function | Local URL |
|----------|-----------|
| api | `http://localhost:5001/{project-id}/europe-west1/api` |
| gitHubReceiver | `http://localhost:5001/{project-id}/europe-west1/gitHubReceiver` |
| auth-service | `http://localhost:5001/{project-id}/europe-west1/{function-name}` |
| game-engine | Eventarc triggered (not HTTP) |

Replace `{project-id}` with your Firebase project ID.

## State Persistence

Emulator data persists between sessions:

- **Import on start:** Loads from `apps/firebase-app/.emulators/`
- **Export on exit:** Saves to the same directory
- **Includes:** Firestore documents, Auth users, Storage files

To start fresh (clear all data):
```bash
rm -rf apps/firebase-app/.emulators/
nx serve firebase-app
```

## Database Seeding

After starting with a fresh database, seed it with initial test data:

```bash
FIREBASE_PROJECT_ID=your-project-id nx seed database-seeds
```

### What Gets Seeded

| Collection | Data |
|------------|------|
| `users` | 40+ user documents (bots + real team members) |
| `users/{id}/connectedAccounts` | GitHub/Strava account links |

### Why Seeding Matters

The seeder creates the critical **user ↔ GitHub account** mapping needed for webhook processing:

```
GitHub webhook (sender: 7045335)
         ↓
Lookup: users/*/connectedAccounts where externalUserId == "7045335"
         ↓
Found: users/1000002/connectedAccounts/github_7045335
         ↓
User ID: 1000002 (mschilling)
```

Without seeded data, webhooks will fail to find the corresponding user.

### Data Files

The seeder uses local override files if they exist:
- `libs/database-seeds/src/lib/data/users.local.json` - Full team roster
- `libs/database-seeds/src/lib/data/connected-accounts.local.json` - GitHub ID mappings

### Clearing and Re-seeding

1. **Clear via Emulator UI:** Open http://localhost:4000/firestore → Click "Clear all data"
2. **Re-seed:** Run the seeder command above

## Verifying Emulators Are Running

1. **Check terminal output** - All emulators should show "started" messages
2. **Open Emulator UI** - http://localhost:4000 should show dashboard
3. **Test API endpoint:**
   ```bash
   curl http://localhost:5001/{project-id}/europe-west1/api/health
   ```

## Starting the Web App (Optional)

In a separate terminal:

```bash
nx serve web
```

The Angular app will start at http://localhost:4200 and automatically connect to the local emulators.

## Common Issues

### Port already in use

If you see port conflicts:
```bash
nx run firebase-app:killports
```

Then restart:
```bash
nx serve firebase-app
```

### Functions not loading

Ensure all functions built successfully. Check for TypeScript errors in:
- `apps/api/`
- `apps/auth-service/`
- `apps/game-engine/`
- `apps/github-receiver/`

### Emulator UI not loading

Wait 10-15 seconds after starting. The UI starts last after all emulators are ready.

## Next Steps

- [GitHub Integration](./04-github-integration.md) - Set up webhook testing with ngrok
- [Debugging Guide](./05-debugging-guide.md) - Learn debugging tools
