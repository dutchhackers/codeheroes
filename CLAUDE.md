# AI Instructions for CodeHeroes

## Project Overview

CodeHeroes is a gamification platform that tracks developer activity via GitHub webhooks and awards points, badges, and achievements.

## Repository Structure

```
codeheroes/
├── apps/
│   ├── firebase-app/     # Firebase orchestrator (emulators, rules)
│   ├── api/              # Main REST API (Cloud Function)
│   ├── auth-service/     # Authentication functions
│   ├── game-engine/      # Game logic (Eventarc triggered)
│   ├── github-receiver/  # GitHub webhook handler
│   └── web/              # Angular frontend
├── libs/
│   ├── server/common/    # Shared server utilities
│   └── shared/           # Code shared between server/client
└── docs/
    ├── local-development/  # Setup and running locally
    └── architecture/       # System architecture
```

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run setup` | Generate config files from .env |
| `nx serve firebase-app` | Start ALL backend emulators |
| `nx serve web` | Start Angular frontend |
| `ngrok http 5001` | Create tunnel for webhook testing |
| `FIREBASE_PROJECT_ID=codeheroes-app-test nx seed database-seeds` | Seed database with test data |

## Important: Starting the Backend

**Always use `nx serve firebase-app`** - this starts everything:
- Builds all 4 function codebases
- Starts all Firebase emulators
- Enables watch mode for hot reload
- Imports/exports emulator data

Do NOT try to start individual functions separately.

## Local Development URLs

| Service | URL |
|---------|-----|
| Emulator UI | http://localhost:4000 |
| Functions | http://localhost:5001 |
| Firestore | http://localhost:8080 |
| Web App | http://localhost:4200 |
| ngrok Inspector | http://localhost:4040 |

## GitHub Webhook Testing

Use the dedicated test repository:

| Item | Value |
|------|-------|
| Test Repo | https://github.com/mschilling/codeheroes-support |
| Local Clone | `/Users/michael.schilling/workspace/projects/sideprojects/code-heroes/codeheroes-support` |
| Webhook Settings | https://github.com/mschilling/codeheroes-support/settings/hooks |

The test repo has webhooks pre-configured for local (ngrok) and production.

### Testing Flow

1. Start emulators: `nx serve firebase-app`
2. Start ngrok: `ngrok http 5001`
3. Update webhook URL if ngrok changed
4. Trigger event in codeheroes-support repo
5. Verify in ngrok inspector and Firestore UI

### Checking Webhook Deliveries (Programmatic)

```bash
# Get ngrok public URL
curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "import sys,json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])"

# List recent webhook requests
curl -s http://127.0.0.1:4040/api/requests/http | python3 -c "
import sys,json
for r in json.load(sys.stdin).get('requests',[]):
    print(f\"{r['request']['method']} {r['request']['uri']} -> {r['response']['status']}\")"
```

### Replaying Webhooks (Without New GitHub Events)

The system uses `X-GitHub-Delivery` header for idempotency. To replay and have the event fully processed, use a new delivery ID:

```bash
# 1. Extract payload from a captured request
curl -s "http://127.0.0.1:4040/api/requests/http" | python3 -c "
import sys, json, base64
r = json.load(sys.stdin)['requests'][0]
raw = r['request'].get('raw', '')
decoded = base64.b64decode(raw).decode('utf-8')
body = decoded.split('\r\n\r\n', 1)[1] if '\r\n\r\n' in decoded else ''
print(body)" > /tmp/webhook_payload.json

# 2. Replay with new delivery ID (bypasses duplicate detection)
curl -X POST "http://localhost:5001/codeheroes-app-test/europe-west1/gitHubReceiver" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: replay-$(date +%s)" \
  -d @/tmp/webhook_payload.json
```

**Browser replay:** Click "Replay" in ngrok inspector (http://localhost:4040) - uses same delivery ID, may be detected as duplicate.

## Database Seeding

After starting with a fresh/empty database, seed it with test data:

```bash
FIREBASE_PROJECT_ID=codeheroes-app-test nx seed database-seeds
```

**What it creates:**
- `users` collection: 40+ user documents (bots + team members)
- `users/{id}/connectedAccounts`: GitHub/Strava account links

**Why it matters:** The seeder creates the user ↔ GitHub account mapping. Without it, webhooks cannot resolve `sender.id` to a CodeHeroes user.

**Clear database (Emulator UI):** http://localhost:4000/firestore → "Clear all data"

**Data files:** `libs/database-seeds/src/lib/data/*.local.json`

## Data Model: Seeded vs Auto-Created

The system uses a two-tier data model:

| Data Type | Source | Collections |
|-----------|--------|-------------|
| **Seeded** | Database seeder | `users`, `users/{id}/connectedAccounts` |
| **Auto-created** | First activity | `users/{id}/stats/current`, `users/{id}/activities`, `gameActions`, `events` |

**Key insight:** Progression state (`users/{id}/stats/current`) is NOT seeded. It's auto-created when a user's first activity is processed. The `ProgressionRepository.updateState()` method handles this automatically.

**Webhook flow:**
```
GitHub webhook (sender.id: 7045335)
    ↓
Lookup: connectedAccounts where externalUserId == "7045335"
    ↓
Found: users/1000002 (mschilling)
    ↓
Create gameAction → Firestore trigger → processGameAction
    ↓
Auto-create progression state if missing → Update XP/counters
```

**Test user mapping:**
| User | User ID | GitHub ID |
|------|---------|-----------|
| Nightcrawler (mschilling) | 1000002 | 7045335 |

## Environment Configuration

Required `.env` variables:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_VAPID_KEY`

Run `npm run setup` after editing `.env` to regenerate config files.

## Documentation

- **Local Development:** `docs/local-development/`
- **Architecture:** `docs/architecture/overview.md`

## Function Endpoints (Local)

| Function | URL |
|----------|-----|
| api | `http://localhost:5001/codeheroes-app-test/europe-west1/api` |
| gitHubReceiver | `http://localhost:5001/codeheroes-app-test/europe-west1/gitHubReceiver` |

## Node.js Version

Requires Node.js 20 (see `.nvmrc`). Use `nvm use` to switch.
