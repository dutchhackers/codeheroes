# Troubleshooting

Common issues and solutions when running CodeHeroes locally.

## Emulator Issues

### Port Already in Use

**Symptom:** Error message about port conflict when starting emulators.

**Solution:**
```bash
# Kill all emulator ports
nx run firebase-app:killports

# Then restart
nx serve firebase-app
```

**Manual port check:**
```bash
lsof -i :5001  # Functions
lsof -i :8080  # Firestore
lsof -i :4000  # Emulator UI
```

### Emulators Won't Start

**Symptom:** Emulators fail to initialize.

**Checklist:**
1. Java installed? (required for Firestore emulator)
   ```bash
   java -version
   ```
2. Firebase CLI logged in?
   ```bash
   firebase login
   ```
3. `.firebaserc` exists and has valid project?
   ```bash
   cat .firebaserc
   ```

### Functions Not Loading

**Symptom:** Functions don't appear in emulator, or show errors.

**Checklist:**
1. Check for build errors:
   ```bash
   nx build api
   nx build github-receiver
   nx build auth-service
   nx build game-engine
   ```
2. Verify dist folders exist:
   ```bash
   ls dist/apps/
   ```
3. Check for TypeScript errors in function code

### Emulator UI Blank or Not Loading

**Symptom:** http://localhost:4000 shows blank page or connection refused.

**Solutions:**
1. Wait 15-20 seconds after starting emulators
2. Check if UI port is blocked:
   ```bash
   lsof -i :4000
   ```
3. Try hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

## ngrok Issues

### ngrok Connection Refused

**Symptom:** ngrok shows "connection refused" when forwarding.

**Cause:** Emulators not running on expected port.

**Solution:**
1. Verify emulators are running:
   ```bash
   lsof -i :5001
   ```
2. If empty, start emulators:
   ```bash
   nx serve firebase-app
   ```
3. Restart ngrok:
   ```bash
   ngrok http 5001
   ```

### ngrok URL Changed

**Symptom:** Webhook suddenly stops working.

**Cause:** Free ngrok URLs change on restart.

**Solution:**
1. Get new ngrok URL from terminal
2. Update GitHub webhook with new URL
3. Consider ngrok paid plan for stable URLs

### ngrok Inspector Not Loading

**Symptom:** http://localhost:4040 not accessible.

**Solutions:**
1. Verify ngrok is running
2. Check if port 4040 is blocked
3. Try `http://127.0.0.1:4040` instead

## GitHub Webhook Issues

### Webhook Shows "Failed" in GitHub

**Checklist:**
1. Is ngrok running?
2. Is the URL format correct?
   ```
   https://{ngrok-url}/{project-id}/europe-west1/gitHubReceiver
   ```
3. Check ngrok inspector for request details
4. Check function logs for errors

### Webhook Delivers but Function Errors

**Symptom:** GitHub shows successful delivery, but data not processed.

**Debug steps:**
1. Check ngrok inspector response body
2. Check terminal logs for error stack trace
3. Verify webhook payload format
4. Check Firestore rules allow writes

### Events Not Triggering

**Symptom:** GitHub actions don't send webhooks.

**Checklist:**
1. Correct events selected in webhook settings?
2. Webhook active (not disabled)?
3. Repository has push access?

## Build Issues

### TypeScript Errors

**Symptom:** Build fails with TypeScript errors.

**Solution:**
```bash
# Check specific app
nx build api --verbose

# See all TypeScript errors
npx tsc --noEmit
```

### Module Not Found

**Symptom:** Error about missing module or import.

**Solutions:**
1. Install dependencies:
   ```bash
   npm install
   ```
2. Check import paths use correct aliases
3. Verify `tsconfig.base.json` paths

### Build Outdated

**Symptom:** Code changes not reflected when running.

**Solution:**
```bash
# Clear dist and rebuild
rm -rf dist/
nx serve firebase-app
```

## Environment Issues

### Missing Environment Variables

**Symptom:** Error about undefined config values.

**Solution:**
1. Check `.env` exists and has all values
2. Re-run setup:
   ```bash
   npm run setup
   ```
3. Verify generated files exist

### Wrong Firebase Project

**Symptom:** Data appearing in wrong project or auth failing.

**Solution:**
1. Check `.firebaserc`:
   ```bash
   cat .firebaserc
   ```
2. Verify `FIREBASE_PROJECT_ID` in `.env`
3. Re-run setup:
   ```bash
   npm run setup
   ```

## Node.js Issues

### Wrong Node Version

**Symptom:** Syntax errors or incompatible features.

**Solution:**
```bash
# Check version
node --version

# Use correct version (nvm)
nvm use

# Or install Node 20
nvm install 20
nvm use 20
```

### Memory Issues

**Symptom:** Node process crashes or hangs.

**Solution:**
```bash
# Increase memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
nx serve firebase-app
```

## Game Engine / Progression Issues

### "Cannot read properties of undefined (reading 'code_push')"

**Symptom:** Error in game-engine when processing webhook events.

**Cause:** Legacy data with old schema missing `counters.actions` structure.

**Solution:**
1. Clear Firestore data via Emulator UI
2. Re-seed the database:
   ```bash
   FIREBASE_PROJECT_ID=your-project-id nx seed database-seeds
   ```
3. Re-trigger the webhook

The progression state is auto-created with the correct structure on first activity.

### User Not Found for Webhook

**Symptom:** Webhook returns 200 but no data processed. Logs show "User not found".

**Cause:** No connected account mapping for the GitHub sender ID.

**Debug:**
1. Check webhook sender ID in ngrok inspector (look for `sender.id` in payload)
2. Verify connected account exists:
   ```bash
   # Check the seed data file
   grep "externalUserId" libs/database-seeds/src/lib/data/connected-accounts.local.json
   ```
3. If missing, add the mapping to `connected-accounts.local.json` and re-seed

### Progression State Not Updating

**Symptom:** XP not increasing, counters not incrementing.

**Debug:**
1. Check emulator logs for errors during `processGameAction`
2. Verify the game action was created in `gameActions` collection
3. Check if Firestore trigger fired (look for "Beginning execution of processGameAction")
4. Inspect `users/{id}/stats/current` document for current state

## Reset Everything

When all else fails, start fresh:

```bash
# Kill all processes
nx run firebase-app:killports

# Remove all build artifacts
rm -rf dist/
rm -rf node_modules/

# Remove emulator data
rm -rf apps/firebase-app/.emulators/

# Reinstall and rebuild
npm install
npm run setup
nx serve firebase-app
```

## Getting Help

If issues persist:
1. Check terminal output for specific error messages
2. Search error messages in project issues
3. Review Firebase and Nx documentation
4. Ask in project communication channels
