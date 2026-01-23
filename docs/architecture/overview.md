# CodeHeroes Architecture Overview

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
│   └── web/                 # Angular frontend
│       └── src/
│           └── environments/ # Firebase config
│
├── libs/                    # Shared libraries
│   ├── server/
│   │   └── common/          # Shared server utilities
│   └── shared/              # Code shared between server/client
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
- **Type:** Eventarc-triggered Function
- **Purpose:** Processes game logic in response to Firestore events
- **Trigger:** Firestore document changes via Eventarc

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

## Nx Commands Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install all dependencies |
| `npm run setup` | Generate config files from .env |
| `nx serve firebase-app` | Start all emulators + watch mode |
| `nx serve web` | Start Angular dev server |
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

### @codeheroes/common
Location: `libs/server/common/`
- Firebase utilities
- Constants (DEFAULT_REGION = 'europe-west1')
- Shared types and interfaces

### @codeheroes/shared
Location: `libs/shared/`
- Code shared between server and client
- DTOs and models
