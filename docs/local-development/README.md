# Local Development Guide

This guide covers everything you need to set up and run CodeHeroes locally for development.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Firebase config
npm run setup

# 3. Start backend emulators
nx serve firebase-app

# 4. (Optional) Seed database
FIREBASE_PROJECT_ID=your-project-id nx seed database-seeds

# 5. (Optional) Start ngrok for webhook testing
ngrok http 5001
```

## Documentation Index

| Guide | Description |
|-------|-------------|
| [01-prerequisites.md](./01-prerequisites.md) | Required tools, versions, and accounts |
| [02-environment-setup.md](./02-environment-setup.md) | Environment variables and setup script |
| [03-running-locally.md](./03-running-locally.md) | Starting emulators and basic seeding |
| [04-github-integration.md](./04-github-integration.md) | ngrok tunnel and GitHub webhooks |
| [05-debugging-guide.md](./05-debugging-guide.md) | Debugging tools and techniques |
| [06-troubleshooting.md](./06-troubleshooting.md) | Common issues and solutions |
| [07-database-seeding.md](./07-database-seeding.md) | Detailed seeding and data flow |
| [08-deployment.md](./08-deployment.md) | Deploying to test environment |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Local Development Stack                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐     ┌──────────┐     ┌──────────────────────────────┐ │
│  │  GitHub  │────▶│  ngrok   │────▶│  Firebase Emulators          │ │
│  │  Webhook │     │  :4040   │     │  ┌────────────────────────┐  │ │
│  └──────────┘     └──────────┘     │  │ Functions    :5001     │  │ │
│                                     │  │ ├─ api                 │  │ │
│                                     │  │ ├─ github-receiver     │  │ │
│                                     │  │ ├─ auth-service        │  │ │
│                                     │  │ └─ game-engine         │  │ │
│                                     │  ├────────────────────────┤  │ │
│                                     │  │ Firestore    :8080     │  │ │
│                                     │  │ Auth         :9099     │  │ │
│                                     │  │ Storage      :9199     │  │ │
│                                     │  │ Pub/Sub      :8085     │  │ │
│                                     │  │ Emulator UI  :4000     │  │ │
│                                     │  └────────────────────────┘  │ │
│                                     └──────────────────────────────┘ │
│                                                                      │
│  ┌──────────┐     ┌──────────────────────────────────────────────┐  │
│  │  Web App │────▶│  Angular Dev Server  :4200                   │  │
│  │          │     │  (connects to emulators)                     │  │
│  └──────────┘     └──────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Key URLs (When Running)

| Service | URL |
|---------|-----|
| Emulator UI | http://localhost:4000 |
| Functions | http://localhost:5001 |
| Firestore | http://localhost:8080 |
| Web App | http://localhost:4200 |
| ngrok Inspector | http://localhost:4040 |

## Test Repository

For webhook testing, use the dedicated test repository:

| Item | Value |
|------|-------|
| GitHub URL | https://github.com/mschilling/codeheroes-support |
| Webhook Settings | https://github.com/mschilling/codeheroes-support/settings/hooks |

## Common Commands

```bash
# Start everything
nx serve firebase-app          # Backend emulators
nx serve web                   # Frontend (optional)
ngrok http 5001                # Webhook tunnel (optional)

# Database operations
FIREBASE_PROJECT_ID=your-project-id nx seed database-seeds

# Build individual apps
nx build api
nx build github-receiver
nx build game-engine
nx build auth-service

# Clear ports if stuck
nx run firebase-app:killports

# Reset emulator data
rm -rf apps/firebase-app/.emulators/

# Deploy to test environment (stop emulators first!)
nx run firebase-app:firebase deploy --only functions    # Backend only
nx run firebase-app:deploy                              # Everything
```

## For AI Agents

When working with this codebase:

1. **Always start with `nx serve firebase-app`** - this starts all emulators
2. **Seed the database** after clearing data
3. **Use ngrok inspector API** for programmatic webhook checking:
   ```bash
   curl -s http://127.0.0.1:4040/api/requests/http
   ```
4. **Check emulator logs** in the terminal running `nx serve firebase-app`
5. **Progression state is auto-created** - no need to seed it manually

See [07-database-seeding.md](./07-database-seeding.md) for detailed data flow documentation.
