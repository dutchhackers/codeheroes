# Deployment Guide

This guide covers deploying CodeHeroes to an existing Firebase environment.

> **Setting up a new environment?** See [09-firebase-environment-setup.md](./09-firebase-environment-setup.md) for complete setup instructions.

## Environments

| Environment | Project ID | Deploy Config |
|-------------|------------|---------------|
| Test | `codeheroes-test` | `-c test` |
| Production | `codeheroes-prod` | `-c production` |

Project IDs are configured in `.firebaserc`.

## Prerequisites

1. **Firebase CLI** installed and logged in:
   ```bash
   firebase login
   ```

2. **`.firebaserc` configured** with your project ID:
   ```json
   {
     "projects": {
       "default": "your-firebase-project-id"
     }
   }
   ```

3. **Emulators stopped** - deployment requires ports to be free:
   ```bash
   lsof -ti:8080,8085,5001,4000,9099,9199,9299 | xargs kill -9
   ```

4. **Code built** - deployment will build automatically, but you can pre-build:
   ```bash
   nx run-many --target=build --projects=api,auth-service,game-engine,github-receiver
   ```

## Backend Deployment (Functions)

### Deploy All Functions

```bash
nx run firebase-app:firebase deploy --only functions
```

This deploys all 4 function codebases:

| Codebase | Functions | Region |
|----------|-----------|--------|
| `api` | api | europe-west1 |
| `auth-service` | onBeforeUserCreated, onBeforeUserSignIn | europe-west1 |
| `game-engine` | processGameAction, onActivityRecorded, onBadgeEarned, onLevelUp, storeRawWebhook | us-central1 |
| `github-receiver` | gitHubReceiver | europe-west1 |

### Deploy Specific Codebase

```bash
# Deploy only API
nx run firebase-app:firebase deploy --only functions:api

# Deploy only game-engine
nx run firebase-app:firebase deploy --only functions:game-engine

# Deploy only github-receiver
nx run firebase-app:firebase deploy --only functions:github-receiver
```

### Deployed Endpoints

After deployment, you'll see the function URLs in the output:

```
Function URL (api:api(europe-west1)): https://api-HASH-ew.a.run.app
Function URL (github-receiver:gitHubReceiver(europe-west1)): https://githubreceiver-HASH-ew.a.run.app
```

Note these URLs for webhook configuration and environment files.

## Firestore Rules & Indexes

### Deploy Rules Only

```bash
nx run firebase-app:firebase deploy --only firestore:rules
```

### Deploy Indexes Only

```bash
nx run firebase-app:firebase deploy --only firestore:indexes
```

### Deploy Both

```bash
nx run firebase-app:firebase deploy --only firestore
```

## Storage Rules

```bash
nx run firebase-app:firebase deploy --only storage
```

## Full Deployment

Deploy everything (functions, hosting, firestore, storage):

```bash
nx run firebase-app:deploy
```

Or using Firebase CLI directly:

```bash
nx run firebase-app:firebase deploy
```

## GitHub Webhook Configuration

After deploying backend, configure webhooks on repositories that should send events to Code Heroes.

### Using GitHub CLI

```bash
# List existing webhooks
gh api repos/OWNER/REPO/hooks --jq '.[] | {id, url: .config.url}'

# Create new webhook
gh api repos/OWNER/REPO/hooks \
  -X POST \
  --input - << 'EOF'
{
  "config": {
    "url": "https://githubreceiver-HASH-ew.a.run.app",
    "content_type": "json"
  },
  "events": ["*"],
  "active": true
}
EOF

# Update existing webhook
gh api repos/OWNER/REPO/hooks/WEBHOOK_ID \
  -X PATCH \
  --input - << 'EOF'
{
  "config": {
    "url": "https://githubreceiver-HASH-ew.a.run.app",
    "content_type": "json"
  },
  "events": ["*"],
  "active": true
}
EOF

# Check recent webhook deliveries
gh api repos/OWNER/REPO/hooks/WEBHOOK_ID/deliveries \
  --jq '.[:5] | .[] | {id, event, status_code, delivered_at}'
```

### Using GitHub Web UI

1. Go to Repository Settings → Webhooks
2. Click "Add webhook"
3. Payload URL: Your deployed `gitHubReceiver` function URL
4. Content type: `application/json`
5. Select "Send me everything"
6. Click "Add webhook"

## Verification

After deployment, verify everything works:

### 1. Check Function Logs

```bash
nx run firebase-app:firebase functions:log --only github-receiver
```

Or in Firebase Console:
https://console.firebase.google.com/project/YOUR_PROJECT_ID/functions/logs

### 2. Test Webhook Delivery

Trigger an event in the test repository (e.g., create an issue) and check:

1. **GitHub webhook deliveries:**
   `https://github.com/OWNER/REPO/settings/hooks`
   Click on the webhook → "Recent Deliveries"

2. **Firebase function logs:**
   ```bash
   nx run firebase-app:firebase functions:log
   ```

3. **Firestore data:**
   https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore

## Troubleshooting

### Deployment Fails with Port Errors

```bash
# Kill processes on Firebase ports
lsof -ti:8080,8085,5001,4000,9099,9199,9299 | xargs kill -9
```

### Function Not Updating

```bash
# Force rebuild before deploy
nx run-many --target=build --projects=api,auth-service,game-engine,github-receiver --skip-nx-cache
nx run firebase-app:firebase deploy --only functions
```

### Check Deployed Version

```bash
nx run firebase-app:firebase functions:list
```

### Webhooks Returning 500 Errors

Check function logs for the specific error:

```bash
firebase --project=codeheroes-test functions:log --only gitHubReceiver
```

**"The query requires an index"**: Deploy indexes:
```bash
firebase --project=codeheroes-test deploy --only firestore:indexes
```

**"Index is currently building"**: Wait a few minutes, then redeliver the webhook:
```bash
gh api repos/OWNER/REPO/hooks/WEBHOOK_ID/deliveries/DELIVERY_ID/attempts -X POST
```

### Check Firestore Indexes

Verify all required indexes are deployed:

```bash
firebase firestore:indexes --project=codeheroes-test
```

Required indexes include:
- `connectedAccounts` (collection group) - externalUserId + provider
- `activities` - createdAt + type, createdAt + processingResult.xp.awarded
- `events` - source.event + createdAt
- `records` - timeframeId + countersLastUpdated
- `users` - active + id

## Frontend Deployment

### Build and Deploy App

```bash
# Test environment
nx build app -c test && nx run firebase-app:firebase -c test deploy --only hosting:app

# Production environment
nx build app -c production && nx run firebase-app:firebase -c production deploy --only hosting:app
```

### Hosting URLs

| Environment | URL |
|-------------|-----|
| Test | https://codeheroes-app-ui-test.web.app |
| Production | https://codeheroes-app-ui.web.app |
