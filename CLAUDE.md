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
│   ├── github-simulator/ # CLI for simulating GitHub webhooks (testing)
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
| `nx serve github-simulator -- push` | Simulate GitHub push event |
| `nx serve github-simulator -- pr open` | Simulate PR creation |
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

## Simulating GitHub Events (Recommended)

Use the GitHub Simulator CLI to test webhook processing locally without ngrok or real GitHub events.

### Quick Start

```bash
# 1. Ensure emulators are running
nx serve firebase-app

# 2. Seed database (required once per fresh database)
FIREBASE_PROJECT_ID=codeheroes-app-test nx seed database-seeds

# 3. Simulate events
nx serve github-simulator -- push                    # Push event
nx serve github-simulator -- pr open                 # Open PR
nx serve github-simulator -- pr merge --number 1     # Merge PR
nx serve github-simulator -- review approve --pr 1   # Approve PR
nx serve github-simulator -- issue open              # Open issue
```

### Common Commands

| Command | GitHub Event | Description |
|---------|--------------|-------------|
| `push` | `push` | Code push to branch |
| `pr open` | `pull_request` | Open a pull request |
| `pr open --draft` | `pull_request` | Open a draft PR |
| `pr merge --number N` | `pull_request` | Merge PR #N |
| `pr close --number N` | `pull_request` | Close PR #N without merging |
| `pr ready --number N` | `pull_request` | Mark draft PR as ready |
| `issue open` | `issues` | Open an issue |
| `issue close --number N` | `issues` | Close issue #N |
| `review approve --pr N` | `pull_request_review` | Approve PR #N |
| `review request-changes --pr N` | `pull_request_review` | Request changes on PR #N |
| `comment pr --pr N` | `issue_comment` | Comment on PR #N |
| `comment issue --issue N` | `issue_comment` | Comment on issue #N |

### Configuration

Requires `.claude/config.local.json` with your GitHub user and test repository info. See `apps/github-simulator/README.md` for full documentation.

### When to Use Simulator vs Real Webhooks

| Scenario | Use |
|----------|-----|
| Testing XP/game logic | Simulator |
| Rapid iteration | Simulator |
| Testing webhook signature validation | Real webhooks (ngrok) |
| Testing with exact GitHub payload structure | Real webhooks (ngrok) |

---

## GitHub Webhook Testing (Alternative: Real Webhooks)

For testing with real GitHub events via ngrok. Use the dedicated test repository:

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

---

## Claude Code Best Practices

### Managing Firebase Emulators

**Starting emulators:**
```bash
nx serve firebase-app
```

**Restarting emulators (when ports are in use):**
```bash
# Kill existing processes on emulator ports
lsof -ti:8080,8085,5001,4000 | xargs kill -9

# Wait a moment, then restart
nx serve firebase-app
```

**Important:** Code changes in `libs/server/progression-engine` or handlers may require a full emulator restart to take effect. Watch mode doesn't always pick up all changes.

**Running emulators in background (for Claude):**
```bash
nx serve firebase-app  # Use run_in_background: true
# Check output: tail -50 /path/to/output/file
```

### Inspecting Firestore Data

**Option 1: Emulator UI (Recommended)**
- Navigate to http://localhost:4000/firestore
- Browse collections and documents directly
- No security rules restrictions

**Option 2: DevTools MCP Browser Automation**
When programmatic access is needed:
```
1. mcp__devtools-mcp__navigate_page -> http://localhost:4000/firestore
2. mcp__devtools-mcp__take_snapshot -> Get page structure
3. mcp__devtools-mcp__click -> Navigate to collections/documents
```

**Option 3: Direct REST API**
Security rules apply - may get PERMISSION_DENIED:
```bash
curl -X POST "http://localhost:8080/v1/projects/codeheroes-app-test/databases/(default)/documents:runQuery" \
  -H "Content-Type: application/json" \
  -d '{"structuredQuery": {"from": [{"collectionId": "gameActions"}], "limit": 5}}'
```

### Firebase MCP Limitations

**Working:** Production Firestore access
```
mcp__firebase__firestore_list_collections
mcp__firebase__firestore_query_collection
```

**Not working reliably:** Emulator access (`use_emulator: true`)
- Has project ID caching bug
- Use Emulator UI or DevTools MCP instead

### Verifying Game Action Processing

After sending a simulated event, check if it was processed:

1. **Send event:**
   ```bash
   nx serve github-simulator -- push
   ```

2. **Check in Emulator UI:**
   - Go to http://localhost:4000/firestore/default/data/gameActions
   - Find the newest document
   - Verify: `status: "processed"` (not "failed")
   - Check: `xpResult.total` has a value
   - No `error` field present

3. **If failed:** Check the `error` field for the cause, often:
   - Missing handler for action type
   - Missing XP config for action type
   - Missing action type in `getInitialCounters()`

### Adding New GitHub Event Types

When implementing a new event type, update these files:

1. `apps/github-receiver/src/core/constants/github.constants.ts` - Add to GitHubEventConfig and SupportedEventType
2. `libs/server/integrations/.../github.interfaces.ts` - Add event interface
3. `libs/server/integrations/.../github.adapter.ts` - Add mapping method
4. `libs/types/src/lib/game/action.types.ts` - Add action type
5. `libs/types/src/lib/game/context.types.ts` - Add context type
6. `libs/types/src/lib/game/metrics.types.ts` - Add metrics type
7. `libs/server/progression-engine/.../xp-values.config.ts` - Add XP config
8. `libs/server/progression-engine/.../xp-calculator.service.ts` - Add to `getBaseXpForActionType()` switch
9. `libs/server/progression-engine/.../handlers/actions/` - Create handler
10. `libs/server/progression-engine/.../action-handler.factory.ts` - Register handler
11. `libs/server/progression-engine/.../progression.repository.ts` - Add to `getInitialCounters()`
12. `apps/github-simulator/src/commands/` - Add simulator command (optional)

### Testing GitHub Events End-to-End

#### Testing Approach

| Approach | When to Use |
|----------|-------------|
| **Real webhooks (ngrok)** | True end-to-end verification, testing exact GitHub payload structure |
| **Simulator** | Events you can't trigger yourself (e.g., self-approving PRs), rapid iteration |

#### Pre-Test Setup Checklist

Before testing, ensure the environment is clean and ready:

```bash
# 1. Clear Firestore database
# Go to http://localhost:4000/firestore → "Clear all data"

# 2. Seed users (required for user → GitHub ID mapping)
FIREBASE_PROJECT_ID=codeheroes-app-test nx seed database-seeds

# 3. Verify emulators are running
curl -s http://localhost:4000 > /dev/null && echo "Emulators running" || echo "Emulators NOT running"

# 4. Check ngrok (if using real webhooks)
curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "import sys,json; t=json.load(sys.stdin)['tunnels']; print(t[0]['public_url'] if t else 'ngrok not running')"
```

#### Verification Commands

After triggering an event, verify it was processed:

```bash
# Check ngrok for incoming webhooks
curl -s http://127.0.0.1:4040/api/requests/http | python3 -c "
import sys,json
for r in json.load(sys.stdin).get('requests',[])[:5]:
    print(f\"{r['request']['method']} {r['request']['uri']} -> {r['response']['status']}\")"

# Check function logs (look for XP calculation)
# In the terminal running emulators, look for:
# - "Processing game action"
# - "XP calculated: ..."
# - Any error messages

# Check gameActions in Firestore
# http://localhost:4000/firestore/default/data/gameActions
# Look for: status: "processed", xpResult.total > 0
```

#### Key Gotchas

| Gotcha | Solution |
|--------|----------|
| One action triggers multiple events | Branch push + PR creation = 2 events. Releases trigger `created`, `published`, `released`. Check all were processed. |
| Can't self-approve PRs on GitHub | Use simulator: `nx serve github-simulator -- review approve --pr N` |
| Old failed gameActions cause confusion | Clear database before testing new changes |
| Handler changes not picked up | Restart emulators after modifying `libs/server/progression-engine` |
| User not found for webhook | Ensure database is seeded and GitHub ID matches |

#### Test User Reference

| User | User ID | GitHub ID | GitHub Username |
|------|---------|-----------|-----------------|
| Nightcrawler | 1000002 | 7045335 | mschilling |

The seeded user maps GitHub ID `7045335` to CodeHeroes user `1000002`. All webhooks from this GitHub account will be attributed to this user.
