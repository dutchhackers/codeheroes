# Architecture Documentation

> **Last updated:** 2025-01-31

This folder contains architecture documentation for the Code Heroes platform.

## Documents

| Document | Description |
|----------|-------------|
| [Overview](./overview.md) | High-level system architecture, monorepo structure, data flows |
| [Badge System](./badge-system.md) | Badge categories, rarity, granting flow, how to add badges |
| [Activity Stream](./activity-stream.md) | Activity types, storage, real-time feed, XP breakdown |

## Quick Links

- **Getting Started:** See [CLAUDE.md](/CLAUDE.md) for local development setup
- **Local Development:** See [docs/local-development/](/docs/local-development/)

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                         Code Heroes                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Web App    │    │ Activity Wall│    │   GitHub     │      │
│  │   (Angular)  │    │   (Angular)  │    │   Webhooks   │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Firebase Functions                     │   │
│  │  ┌─────────┐ ┌─────────────┐ ┌─────────┐ ┌───────────┐  │   │
│  │  │   API   │ │GitHub Recv. │ │Auth Svc │ │Game Engine│  │   │
│  │  └─────────┘ └─────────────┘ └─────────┘ └───────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      Firestore                           │   │
│  │  users/ │ gameActions/ │ events/ │ leaderboards/        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### Progression System
Users earn XP through GitHub activities (pushes, PRs, reviews). XP accumulates to increase levels, and specific actions/milestones grant badges.

### Activity Feed
Real-time stream of all user activities across the platform. Uses Firestore collection group queries for global feed.

### Badge System
Three categories of badges (level, milestone, special) with five rarity tiers (Common → Legendary).
