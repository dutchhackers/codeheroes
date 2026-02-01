# AI Instructions for CodeHeroes

## Project Overview

CodeHeroes is a gamification platform that tracks developer activity via GitHub webhooks and awards points, badges, and achievements.

**Naming convention:** The product name is "Code Heroes" (two words) in user-facing text, but "CodeHeroes" (one word) in code identifiers, file names, and technical references.

## Repository Structure

```
codeheroes/
├── apps/
│   ├── firebase-app/     # Firebase orchestrator (emulators, rules)
│   ├── frontend/
│   │   ├── app/          # Main PWA app (Angular) - formerly activity-wall
│   │   └── web-legacy/   # Legacy Angular frontend
│   ├── api/              # Main REST API (Cloud Function)
│   ├── auth-service/     # Authentication functions
│   ├── game-engine/      # Game logic (Eventarc triggered)
│   ├── github-receiver/  # GitHub webhook handler
│   └── github-simulator/ # CLI for simulating GitHub webhooks (testing)
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
| `nx serve web-legacy` | Start legacy Angular frontend |
| `nx serve github-simulator -- push` | Simulate GitHub push event |
| `nx serve github-simulator -- pr open` | Simulate PR creation |
| `FIREBASE_PROJECT_ID=your-project-id nx seed database-seeds` | Seed database with test data |

## Important: Starting the Backend

**Always use `nx serve firebase-app`** - this starts everything:
- Builds all 4 function codebases
- Starts all Firebase emulators
- Enables watch mode for hot reload
- Imports/exports emulator data

Do NOT try to start individual functions separately.

## Local Development URLs

| Service | URL | Port |
|---------|-----|------|
| Emulator UI | http://localhost:4000 | 4000 |
| Emulator Hub | http://localhost:4400 | 4400 |
| Functions | http://localhost:5001 | 5001 |
| Firestore | http://localhost:8080 | 8080 |
| Pub/Sub | http://localhost:8085 | 8085 |
| Auth | http://localhost:9099 | 9099 |
| Storage | http://localhost:9199 | 9199 |
| Eventarc | http://localhost:9299 | 9299 |
| Web App | http://localhost:4200 | 4200 |
| Activity Wall | http://localhost:4201 | 4201 |
| ngrok Inspector | http://localhost:4040 | 4040 |

### Verify Emulators Running

```bash
# Quick check - returns JSON if hub is running
curl -s http://127.0.0.1:4400/emulators

# Check specific ports
lsof -i:4000 -i:8080 -i:5001 -i:9099

# Kill all emulator processes (before restart)
lsof -ti:8080,8085,5001,4000,9099,9199,9299 | xargs kill -9 2>/dev/null || true
```

## Simulating GitHub Events (Recommended)

Use the GitHub Simulator CLI to test webhook processing locally without ngrok or real GitHub events.

### Quick Start

```bash
# 1. Ensure emulators are running
nx serve firebase-app

# 2. Seed database (required once per fresh database)
FIREBASE_PROJECT_ID=your-project-id nx seed database-seeds

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

For testing with real GitHub events via ngrok. Use the dedicated test repository.

> **Note:** Test repository URLs are in `.claude/CLAUDE.local.md` (not committed).

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
curl -X POST "http://localhost:5001/your-project-id/europe-west1/gitHubReceiver" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: replay-$(date +%s)" \
  -d @/tmp/webhook_payload.json
```

**Browser replay:** Click "Replay" in ngrok inspector (http://localhost:4040) - uses same delivery ID, may be detected as duplicate.

## Database Seeding

After starting with a fresh/empty database, seed it with test data:

```bash
FIREBASE_PROJECT_ID=your-project-id nx seed database-seeds
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

## XP Values Reference

Base XP values and bonuses for each game action type. All values have been scaled 12x to support the expanded leveling system. Config in `libs/server/progression-engine/.../xp-values.config.ts`.

| Game Action Type | Base XP | Possible Bonuses |
|------------------|---------|------------------|
| `code_push` | 1440 | +3000 (multiple commits) |
| `pull_request_create` | 1200 | +1200 (multiple files), +2400 (significant changes) |
| `pull_request_merge` | 1200 | +1200 (multiple files), +2400 (significant changes) |
| `pull_request_close` | 600 | +600 (multiple files), +1200 (significant changes) |
| `code_review_submit` | 960 | +1200 (detailed), +600 (multiple files), +1800 (thorough) |
| `review_comment_create` | 480 | +360 (with suggestion), +240 (detailed) |
| `comment_create` | 360 | +240 (detailed) |
| `issue_create` | 960 | +840 (detailed description), +360 (with labels) |
| `issue_close` | 720 | +600 (referenced in PR) |
| `issue_reopen` | 480 | +360 (with updates) |
| `release_publish` | 2400 | +1800 (major), +600 (minor), +360 (with notes) |
| `ci_success` | 360 | +600 (deployment) |
| `discussion_create` | 720 | +480 (detailed) |
| `discussion_comment` | 360 | +840 (accepted answer) |

### GitHub Event → Game Action Mapping

| # | GitHub Event | Simulator Command | Game Action Type |
|---|--------------|-------------------|------------------|
| 1 | `push` | `push` | `code_push` |
| 2 | `pull_request` (opened) | `pr open` | `pull_request_create` |
| 3 | `pull_request` (closed+merged) | `pr merge --number N` | `pull_request_merge` |
| 4 | `pull_request` (closed) | `pr close --number N` | `pull_request_close` |
| 5 | `pull_request_review` (approve) | `review approve --pr N` | `code_review_submit` |
| 6 | `pull_request_review` (comment) | `review comment --pr N` | `code_review_submit` |
| 7 | `pull_request_review_comment` | `review-comment create --pr N` | `review_comment_create` |
| 8 | `issue_comment` (PR) | `comment pr --pr N` | `comment_create` |
| 9 | `issue_comment` (issue) | `comment issue --issue N` | `comment_create` |
| 10 | `issues` (opened) | `issue open` | `issue_create` |
| 11 | `issues` (closed) | `issue close --number N` | `issue_close` |
| 12 | `release` (published) | `release publish --tag vX.X.X` | `release_publish` |
| 13 | `workflow_run` (success) | `workflow success` | `ci_success` |
| 14 | `discussion` (created) | `discussion create` | `discussion_create` |
| 15 | `discussion_comment` | `discussion comment --discussion N` | `discussion_comment` |

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
- **Deployment:** `docs/local-development/08-deployment.md`
- **Local Secrets & URLs:** `.claude/CLAUDE.local.md` (not committed - contains environment URLs, secret setup commands, webhook IDs)

## Function Endpoints (Local)

| Function | URL |
|----------|-----|
| api | `http://localhost:5001/your-project-id/europe-west1/api` |
| gitHubReceiver | `http://localhost:5001/your-project-id/europe-west1/gitHubReceiver` |

## Node.js Version

Requires Node.js 24 (see `.nvmrc`). Use `nvm use` to switch.

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
curl -X POST "http://localhost:8080/v1/projects/your-project-id/databases/(default)/documents:runQuery" \
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

### Deploying Firebase Functions

**Standard deployment:**
```bash
nx run firebase-app:firebase deploy --only functions
```

**Deploying a single codebase:**
```bash
nx run firebase-app:firebase deploy --only functions:auth-service
```

**Common deployment issues and solutions:**

| Issue | Symptom | Solution |
|-------|---------|----------|
| "No changes detected" | Function skipped despite code changes | 1. Delete `dist/apps/<function>` folder<br>2. Rebuild with `nx build <function> --skip-nx-cache`<br>3. Redeploy |
| npm ci fails with missing packages | `Missing: <package> from lock file` | 1. `cd dist/apps/<function>`<br>2. `npm install --package-lock-only`<br>3. Redeploy |
| Changes not taking effect | Function logs show old behavior | Check the `firebase-functions-hash` in deploy output - if unchanged, the new code wasn't deployed |

**Troubleshooting deployment:**
1. Check if changes are in source: `grep "your-change" apps/<function>/src/**/*.ts`
2. Check if changes are in build: `grep "your-change" dist/apps/<function>/main.js`
3. If in build but not deploying: regenerate package-lock.json (see above)
4. Force deploy: `nx run firebase-app:firebase deploy --only functions:<codebase> --force`

**Verifying deployment via logs:**
```bash
# Use Firebase MCP to check function logs
mcp__firebase__functions_get_logs with function_names: ["functionName"]
```

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
FIREBASE_PROJECT_ID=your-project-id nx seed database-seeds

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

---

## Deployment

### Deploy Backend (Functions Only)

```bash
# Stop emulators first (required - ports must be free)
lsof -ti:8080,8085,5001,4000,9099,9199,9299 | xargs kill -9

# Deploy all functions to test environment
nx run firebase-app:firebase deploy --only functions
```

**Deployed functions:**
- `api` (europe-west1) - REST API
- `auth-service` (europe-west1) - onBeforeUserCreated, onBeforeUserSignIn
- `game-engine` (us-central1) - processGameAction, onActivityRecorded, onBadgeEarned, onLevelUp, storeRawWebhook
- `github-receiver` (europe-west1) - gitHubReceiver webhook endpoint

> **Note:** Production URLs are in `.claude/CLAUDE.local.md` (not committed).

### Deploy Everything (Functions + Hosting)

```bash
nx run firebase-app:deploy
```

### Deploy Hosting Only

```bash
nx run firebase-app:firebase deploy --only hosting
```

---

## Code Heroes App (Main PWA)

The main Angular app for displaying real-time activity on TV/public displays.

| Item | Value |
|------|-------|
| Location | `apps/frontend/app/` |
| Port | 4201 |
| Start (local) | `nx serve app` |
| Start (test) | `nx serve app --configuration=test` |
| Deploy (test) | `nx run firebase-app:firebase deploy --only hosting:app` (uses test project) |
| Deploy (prod) | `nx run firebase-app:firebase deploy --only hosting:app` (uses prod project) |

---

## GitHub Webhook Management

Use the `gh` CLI to manage webhooks in the test repository.

> **Note:** Repository and webhook URLs are in `.claude/CLAUDE.local.md` (not committed).

### List Webhooks

```bash
gh api repos/OWNER/REPO/hooks --jq '.[] | {id, url: .config.url, events}'
```

### Create Webhook

```bash
gh api repos/OWNER/REPO/hooks \
  -X POST \
  --input - << 'EOF'
{
  "config": {
    "url": "YOUR_WEBHOOK_RECEIVER_URL",
    "content_type": "json"
  },
  "events": ["*"],
  "active": true
}
EOF
```

### Update Webhook

```bash
# Get webhook ID first
gh api repos/OWNER/REPO/hooks --jq '.[].id'

# Update to send all events
gh api repos/OWNER/REPO/hooks/WEBHOOK_ID \
  -X PATCH \
  --input - << 'EOF'
{
  "events": ["*"],
  "active": true
}
EOF
```

### Delete Webhook

```bash
gh api repos/OWNER/REPO/hooks/WEBHOOK_ID -X DELETE
```

---

## Simulating Events for Multiple Users

The github-simulator only supports one user (configured in `.claude/config.local.json`). To simulate events for multiple users, send direct webhook payloads:

```bash
# Send a push event for a specific user
curl -X POST "http://localhost:5001/YOUR_PROJECT_ID/europe-west1/gitHubReceiver" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: sim-$(date +%s)" \
  -d '{
    "ref": "refs/heads/main",
    "repository": {
      "id": 12345678,
      "name": "your-test-repo",
      "full_name": "owner/your-test-repo",
      "owner": {"login": "owner", "id": 12345}
    },
    "sender": {"id": GITHUB_USER_ID, "login": "username"},
    "commits": [{"id": "abc123", "message": "Update"}],
    "head_commit": {"id": "abc123", "message": "Update"}
  }'
```

**User ID Reference (from seed data):**

| Display Name | User ID | GitHub ID | GitHub Username |
|--------------|---------|-----------|-----------------|
| Nightcrawler | 1000002 | 7045335 | mschilling |
| Cassshh | 1000003 | 10263056 | cassshh |
| Guido | 1000004 | 80984882 | guidovanvilsteren |
| Nick | 1000005 | 89972776 | nratering |
| Aalt | 1000006 | 35026618 | aaltw |
| Jesper | 1000007 | 10846244 | jstrating |
| Arwin | 1000008 | 30255086 | ArwinStrating |
| Ronan | 1000009 | 4209748 | rsuper |

Full list in `libs/database-seeds/src/lib/data/connected-accounts.local.json`.

---

## DevTools MCP for Visual Verification

Use DevTools MCP to view and interact with web UIs programmatically.

### Navigate and Screenshot

```
mcp__devtools-mcp__list_pages              # List open pages
mcp__devtools-mcp__navigate_page           # Navigate to URL
mcp__devtools-mcp__take_screenshot         # Capture current view
mcp__devtools-mcp__take_snapshot           # Get accessibility tree (for element IDs)
```

### Interact with Elements

```
mcp__devtools-mcp__click                   # Click element by uid
mcp__devtools-mcp__fill                    # Fill input field
mcp__devtools-mcp__press_key               # Press keyboard key (Home, End, Enter, etc.)
```

### Example: Verify Activity Wall

```
1. mcp__devtools-mcp__navigate_page url="http://localhost:4201"
2. mcp__devtools-mcp__take_screenshot
3. Trigger events: nx serve github-simulator -- push
4. mcp__devtools-mcp__take_screenshot  # See new activity
```

---

## Programmatic Login to Activity Wall (Auth Emulator)

When testing the Activity Wall locally, you can log in programmatically without clicking through the Google Sign-In popup. This is useful for automated testing and CI/CD.

### How It Works

The Firebase Auth Emulator accepts fake Google credentials. The flow:

1. **POST to Auth Emulator** - Send a fake Google ID token
2. **Store tokens in IndexedDB** - Save the response tokens where Firebase SDK expects them
3. **Reload the page** - Firebase SDK picks up the stored session

### Step 1: Call Auth Emulator REST API

```bash
# Get your API key from apps/frontend/app/src/environments/environment.ts
API_KEY="your-firebase-api-key"

# Create URL-encoded id_token payload
ID_TOKEN=$(python3 -c "import urllib.parse, json; print(urllib.parse.quote(json.dumps({
  'sub': 'test-user-google-id',
  'email': 'testuser@example.com',
  'name': 'Test User',
  'picture': 'https://example.com/photo.png',
  'email_verified': True,
  'iss': '', 'aud': '', 'exp': 0, 'iat': 0
})))")

curl -s -X POST "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"requestUri\": \"http://localhost:9099/emulator/auth/handler?providerId=google.com&id_token=${ID_TOKEN}\",
    \"sessionId\": \"ValueNotUsedByAuthEmulator\",
    \"returnSecureToken\": true,
    \"returnIdpCredential\": true
  }"
```

The response contains `localId` (Firebase UID), `idToken`, and `refreshToken`.

### Step 2: Store Tokens via Browser JavaScript

Execute this in the browser (via DevTools MCP `evaluate_script`) on http://localhost:4201:

```javascript
async (apiKey, user, authResponse) => {
  // user = { sub, email, name, picture }
  // authResponse = response from step 1

  const userObject = {
    uid: authResponse.localId,
    email: authResponse.email,
    emailVerified: authResponse.emailVerified,
    displayName: authResponse.displayName,
    isAnonymous: false,
    photoURL: authResponse.photoUrl,
    providerData: [{
      providerId: "google.com",
      uid: user.sub,
      displayName: authResponse.displayName,
      email: authResponse.email,
      phoneNumber: null,
      photoURL: authResponse.photoUrl
    }],
    stsTokenManager: {
      refreshToken: authResponse.refreshToken,
      accessToken: authResponse.idToken,
      expirationTime: Date.now() + (parseInt(authResponse.expiresIn) * 1000)
    },
    createdAt: Date.now().toString(),
    lastLoginAt: Date.now().toString(),
    apiKey: apiKey,
    appName: "[DEFAULT]"
  };

  // Store in IndexedDB
  const request = indexedDB.open('firebaseLocalStorageDb', 1);
  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
      db.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' });
    }
  };
  request.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction('firebaseLocalStorage', 'readwrite');
    const store = tx.objectStore('firebaseLocalStorage');
    const key = `firebase:authUser:${apiKey}:[DEFAULT]`;
    store.put({ fbase_key: key, value: userObject });
  };
}
```

### Step 3: Reload the Page

After storing tokens, reload the page. Firebase SDK will read from IndexedDB and the user will be authenticated.

### Complete Flow with DevTools MCP

```
1. mcp__devtools-mcp__navigate_page  url="http://localhost:4201"
2. mcp__devtools-mcp__evaluate_script  function="<combined login script>"
3. mcp__devtools-mcp__navigate_page  type="reload"
4. mcp__devtools-mcp__take_screenshot  # Verify logged in
```

### Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp` | Create/login user |
| `http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:lookup` | Get user info |
| `http://localhost:4000/auth` | View users in Emulator UI |

### Notes

- The `sub` field in the ID token becomes the Google provider UID
- Each unique `sub` + `email` combination creates a new Firebase Auth user
- Tokens are stored in IndexedDB key: `firebase:authUser:{apiKey}:[DEFAULT]`
- This only works with the Auth Emulator, not production Firebase Auth

---

## Git Workflow

### Fetch and Rebase

```bash
git fetch origin main
git log --oneline HEAD..origin/main  # Check new commits on main
git rebase origin/main               # Rebase current branch
git push --force-with-lease origin BRANCH_NAME
```

### Commit Message Format

```
type(scope): description

- feat: New feature
- fix: Bug fix
- chore: Maintenance
- docs: Documentation
```
