# CodeHeroes Architecture Overview

> **Last updated:** 2025-01-31

This document provides a high-level overview of the CodeHeroes system architecture.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CODEHEROES LOCAL DEVELOPMENT                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  EXTERNAL                    TUNNEL                                 │
│  ┌────────┐                 ┌───────┐                              │
│  │ GitHub │ ──webhooks───►  │ ngrok │ ──► localhost:5001           │
│  └────────┘                 └───────┘     (functions)              │
│                              :4040                                  │
│                            (inspector)                              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  FIREBASE EMULATORS (nx serve firebase-app)                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │Functions │  │Firestore │  │   Auth   │  │ Storage  │   │   │
│  │  │  :5001   │  │  :8080   │  │  :9099   │  │  :9199   │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│  │                                                             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────────────┐  │   │
│  │  │ Pub/Sub  │  │ Eventarc │  │     Emulator UI         │  │   │
│  │  │  :8085   │  │  :9299   │  │       :4000             │  │   │
│  │  └──────────┘  └──────────┘  └─────────────────────────┘  │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CLOUD FUNCTIONS (4 codebases)                                     │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐    │
│  │   api       │github-      │auth-service │  game-engine    │    │
│  │  (HTTP)     │receiver     │   (HTTP)    │  (Eventarc)     │    │
│  │             │  (HTTP)     │             │                 │    │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
codeheroes/
├── apps/
│   ├── firebase-app/        # Firebase orchestrator (emulators, rules)
│   │   ├── .emulators/      # Persisted emulator data
│   │   ├── firestore.rules  # Security rules
│   │   ├── storage.rules    # Storage security rules
│   │   └── project.json     # Nx targets (serve, deploy, etc.)
│   │
│   ├── api/                 # Main API (HTTP function)
│   │   └── src/main.ts      # Exports: api
│   │
│   ├── auth-service/        # Authentication functions
│   │   └── src/main.ts      # HTTP triggers
│   │
│   ├── game-engine/         # Game logic (Eventarc triggered)
│   │   └── src/main.ts      # Event-driven processing
│   │
│   ├── github-receiver/     # GitHub webhook handler
│   │   └── src/main.ts      # Exports: gitHubReceiver
│   │
│   ├── github-simulator/    # CLI for simulating GitHub webhooks
│   │   └── src/             # Testing tool
│   │
│   └── frontend/
│       ├── app/             # Main PWA app (Angular) - real-time activity display
│       │   └── src/         # TV/public display app
│       │
│       └── web-legacy/      # Legacy Angular frontend
│           └── src/
│               └── environments/ # Firebase config
│
├── libs/                    # Shared libraries
│   ├── server/
│   │   ├── common/          # Shared server utilities
│   │   └── progression-engine/  # XP, levels, badges, rewards
│   ├── types/               # Shared TypeScript types
│   └── shared/              # Code shared between server/client
│
├── docs/                    # Documentation
│   ├── architecture/        # System architecture docs
│   └── local-development/   # Setup guides
│
├── firebase.json            # Firebase configuration
├── .firebaserc              # Firebase project targeting
├── nx.json                  # Nx workspace configuration
└── package.json             # Dependencies and scripts
```

## Function Codebases

### api
- **Type:** HTTP Cloud Function
- **Export:** `api`
- **Purpose:** Main REST API for the application
- **Region:** europe-west1
- **Local URL:** `http://localhost:5001/{project}/europe-west1/api`

### github-receiver
- **Type:** HTTP Cloud Function
- **Export:** `gitHubReceiver`
- **Purpose:** Receives and processes GitHub webhooks
- **Region:** europe-west1
- **Local URL:** `http://localhost:5001/{project}/europe-west1/gitHubReceiver`

### auth-service
- **Type:** HTTP Cloud Function
- **Purpose:** Authentication-related operations
- **Region:** europe-west1

### game-engine
- **Type:** Eventarc/Pub/Sub-triggered Functions
- **Purpose:** Processes game logic in response to events
- **Region:** us-central1 (Eventarc requirement)
- **Functions:**
  - `processGameAction` - Firestore trigger on gameActions collection
  - `onActivityRecorded` - Pub/Sub trigger for activity events
  - `onBadgeEarned` - Pub/Sub trigger for badge events
  - `onLevelUp` - Pub/Sub trigger for level-up events
  - `storeRawWebhook` - Stores raw webhook payloads

## Data Flow

### GitHub Webhook Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    GitHub Webhook Flow                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Developer pushes code / opens PR / creates issue           │
│                          ↓                                     │
│  2. GitHub sends webhook POST to configured URL                │
│                          ↓                                     │
│  3. ngrok (local) or Cloud Functions (prod) receives request   │
│                          ↓                                     │
│  4. gitHubReceiver function processes webhook                  │
│     - Validates payload                                        │
│     - Extracts event data                                      │
│     - Writes to Firestore                                      │
│                          ↓                                     │
│  5. Firestore document created/updated                         │
│                          ↓                                     │
│  6. Eventarc triggers game-engine (if configured)              │
│     - Calculates points                                        │
│     - Updates player stats                                     │
│     - Triggers achievements                                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Key URLs (Local Development)

| Service | URL | Purpose |
|---------|-----|---------|
| Emulator UI | http://localhost:4000 | Dashboard for all emulators |
| Functions | http://localhost:5001 | Cloud Functions |
| Firestore | http://localhost:8080 | Database |
| Auth | http://localhost:9099 | Authentication |
| Storage | http://localhost:9199 | File storage |
| Pub/Sub | http://localhost:8085 | Message queue |
| Eventarc | http://localhost:9299 | Event routing |
| ngrok Inspector | http://localhost:4040 | Webhook debugging |
| Web App | http://localhost:4200 | Angular dev server |
| Activity Wall | http://localhost:4201 | Real-time activity display |

## Nx Commands Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install all dependencies |
| `npm run setup` | Generate config files from .env |
| `nx serve firebase-app` | Start all emulators + watch mode |
| `nx serve web-legacy` | Start legacy Angular dev server |
| `nx serve app` | Start main PWA app |
| `nx serve github-simulator -- push` | Simulate GitHub push event |
| `nx build api` | Build api functions |
| `nx run firebase-app:killports` | Kill all emulator ports |
| `nx run firebase-app:deploy` | Deploy to Firebase |

## Configuration Files

| File | Purpose |
|------|---------|
| `firebase.json` | Firebase services config, emulator ports |
| `.firebaserc` | Firebase project targeting |
| `.env` | Environment variables (secrets, not committed) |
| `.env.example` | Template for .env file |
| `nx.json` | Nx workspace settings |
| `tsconfig.base.json` | TypeScript path aliases |

## Shared Libraries

### @codeheroes/types
Location: `libs/types/`
- Activity types (GameActionActivity, BadgeEarnedActivity, LevelUpActivity)
- Game action types and contexts
- Badge and progression types
- Type guards for discriminated unions

### @codeheroes/common
Location: `libs/server/common/`
- Firebase utilities (DatabaseInstance, logger)
- Constants (DEFAULT_REGION = 'europe-west1')
- Shared server interfaces

### @codeheroes/progression-engine
Location: `libs/server/progression-engine/`
- XP calculation and configuration
- Level thresholds and progression
- Badge catalog and granting services
- Activity recording and event processing

### @codeheroes/shared
Location: `libs/shared/`
- Code shared between server and client
- DTOs and models

## Related Documentation

- [Badge System](./badge-system.md) - How badges are earned and granted
- [Activity Stream](./activity-stream.md) - Activity types and real-time feed
