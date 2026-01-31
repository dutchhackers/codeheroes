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

After deployment, you'll see the function URLs:

| Function | URL |
|----------|-----|
| API | https://api-5f4quj3fia-ew.a.run.app |
| GitHub Receiver | https://githubreceiver-5f4quj3fia-ew.a.run.app |

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

After deploying backend, configure the webhook in your test repository to point to the deployed URL.

### Using GitHub CLI

```bash
# List existing webhooks
gh api repos/mschilling/codeheroes-support/hooks --jq '.[] | {id, url: .config.url}'

# Create new webhook for test environment
gh api repos/mschilling/codeheroes-support/hooks \
  -X POST \
  --input - << 'EOF'
{
  "config": {
    "url": "https://githubreceiver-5f4quj3fia-ew.a.run.app",
    "content_type": "json"
  },
  "events": ["*"],
  "active": true
}
EOF

# Update existing webhook to send all events
gh api repos/mschilling/codeheroes-support/hooks/WEBHOOK_ID \
  -X PATCH \
  --input - << 'EOF'
{
  "events": ["*"],
  "active": true
}
EOF
```

### Using GitHub Web UI

1. Go to https://github.com/mschilling/codeheroes-support/settings/hooks
2. Click "Add webhook"
3. Payload URL: `https://githubreceiver-5f4quj3fia-ew.a.run.app`
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
   https://github.com/mschilling/codeheroes-support/settings/hooks
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
