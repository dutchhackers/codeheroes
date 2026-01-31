# Badge System Architecture

> **Last updated:** 2025-01-31

This document describes the badge system in Code Heroes, including badge types, how they're earned, and the underlying implementation.

## Overview

Badges are visual achievements that recognize developer accomplishments. They appear in the user's profile and activity feed, providing social recognition and gamification visibility.

## Badge Categories

Badges are organized into three categories:

| Category | Description | Examples |
|----------|-------------|----------|
| **Level** | Awarded automatically when reaching a new level | Code Novice (Lv1), Code Hero (Lv10), Code Architect (Lv20) |
| **Milestone** | Awarded for activity count thresholds | First Push, PR Pro (50 PRs), Review Master (100 reviews) |
| **Special** | Awarded for unique behaviors and patterns | Early Bird, Night Owl, Weekend Warrior |

## Badge Rarity

Each badge has a rarity that indicates its difficulty to obtain:

| Rarity | Color | Typical Requirements |
|--------|-------|---------------------|
| **COMMON** | Gray | Easy to obtain (levels 1-4, first activities) |
| **UNCOMMON** | Green | Moderate effort (levels 5-9, 10-25 activities) |
| **RARE** | Blue | Significant effort (levels 10-14, 50 activities) |
| **EPIC** | Purple | Major achievement (levels 15-19, 100 activities) |
| **LEGENDARY** | Gold | Elite status (level 20, exceptional achievements) |

## Level Badges

Level badges are automatically granted when a user reaches each level. There are 20 levels plus a bonus mastery badge:

| Level | Badge | Icon | Rarity |
|-------|-------|------|--------|
| 1 | Code Novice | 🌱 | COMMON |
| 2 | Code Initiate | 🔰 | COMMON |
| 3 | Code Apprentice | 📚 | COMMON |
| 4 | Code Student | ✏️ | COMMON |
| 5 | Code Explorer | 🧭 | UNCOMMON |
| 6 | Code Adventurer | ⚔️ | UNCOMMON |
| 7 | Code Adept | 🎯 | UNCOMMON |
| 8 | Code Enthusiast | 🔥 | UNCOMMON |
| 9 | Code Practitioner | 🛠️ | UNCOMMON |
| 10 | Code Hero | 🦸 | RARE |
| 11 | Code Warrior | ⚡ | RARE |
| 12 | Code Veteran | 🎖️ | RARE |
| 13 | Code Specialist | 🔬 | RARE |
| 14 | Code Expert | 💎 | RARE |
| 15 | Code Master | 👑 | EPIC |
| 16 | Code Sage | 🧙 | EPIC |
| 17 | Code Legend | ⭐ | EPIC |
| 18 | Code Champion | 🏅 | EPIC |
| 19 | Code Oracle | 🔮 | EPIC |
| 20 | Code Architect | 🏆 | LEGENDARY |
| 20+ | Level 20 Mastery | 🎓 | LEGENDARY |

## Milestone Badges

Milestone badges reward consistent activity. Each activity type has multiple thresholds:

### Code Push Milestones

| Badge ID | Name | Icon | Threshold | Rarity |
|----------|------|------|-----------|--------|
| `first_push` | First Push | 🚀 | 1 | COMMON |
| `push_10` | Push Rookie | 📤 | 10 | COMMON |
| `push_25` | Push Regular | 📦 | 25 | UNCOMMON |
| `push_50` | Push Pro | 🎯 | 50 | RARE |
| `push_100` | Push Master | 💫 | 100 | EPIC |

### Pull Request Create Milestones

| Badge ID | Name | Icon | Threshold | Rarity |
|----------|------|------|-----------|--------|
| `first_pr` | First PR | 🎉 | 1 | COMMON |
| `pr_10` | PR Contributor | 🔀 | 10 | COMMON |
| `pr_25` | PR Regular | 🔃 | 25 | UNCOMMON |
| `pr_50` | PR Pro | ⚡ | 50 | RARE |
| `pr_100` | PR Legend | 🏆 | 100 | EPIC |

### Pull Request Merge Milestones

| Badge ID | Name | Icon | Threshold | Rarity |
|----------|------|------|-----------|--------|
| `first_merge` | First Merge | 🎊 | 1 | COMMON |
| `merge_10` | Merger | 🔗 | 10 | COMMON |
| `merge_25` | Integration Expert | 🔧 | 25 | UNCOMMON |
| `merge_50` | Merge Master | ⚙️ | 50 | RARE |
| `merge_100` | Merge Legend | 👑 | 100 | EPIC |

### Code Review Milestones

| Badge ID | Name | Icon | Threshold | Rarity |
|----------|------|------|-----------|--------|
| `first_review` | First Review | 👀 | 1 | COMMON |
| `review_10` | Reviewer | 🔍 | 10 | COMMON |
| `review_25` | Quality Guardian | 🛡️ | 25 | UNCOMMON |
| `review_50` | Review Expert | 🎓 | 50 | RARE |
| `review_100` | Review Master | 🏅 | 100 | EPIC |

### Issue Milestones

| Badge ID | Name | Icon | Threshold | Rarity |
|----------|------|------|-----------|--------|
| `first_issue` | First Issue | 📝 | 1 | COMMON |
| `issue_10` | Issue Reporter | 🐛 | 10 | COMMON |
| `issue_25` | Bug Hunter | 🔎 | 25 | UNCOMMON |
| `issue_50` | Issue Expert | 📋 | 50 | RARE |

### Release Milestones

| Badge ID | Name | Icon | Threshold | Rarity |
|----------|------|------|-----------|--------|
| `first_release` | First Release | 🎁 | 1 | UNCOMMON |
| `release_10` | Release Manager | 📦 | 10 | RARE |
| `release_25` | Release Pro | 🚢 | 25 | EPIC |

## Special Badges

Special badges reward unique behaviors:

| Badge ID | Name | Icon | Trigger | Rarity |
|----------|------|------|---------|--------|
| `early_bird` | Early Bird | 🌅 | Activity before 7 AM | UNCOMMON |
| `night_owl` | Night Owl | 🦉 | Activity after 11 PM | UNCOMMON |
| `weekend_warrior` | Weekend Warrior | ⚔️ | 5 activities in one weekend | RARE |

### Future Special Badges (Planned)

- **Streak Master** - 7-day activity streak
- **Marathon Coder** - 30-day activity streak
- **Friday Deploy** - Released on a Friday

## Badge Granting Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ GitHub Webhook  │───▶│  Game Engine     │───▶│ EventProcessor  │
│ (code_push)     │    │ processGameAction│    │                 │
└─────────────────┘    └──────────────────┘    └────────┬────────┘
                                                        │
                       ┌────────────────────────────────┼────────────────────────────────┐
                       │                                │                                │
                       ▼                                ▼                                ▼
              ┌────────────────┐              ┌─────────────────┐              ┌─────────────────┐
              │ Level Service  │              │ MilestoneBadge  │              │ SpecialBadge    │
              │ (on level up)  │              │ Service         │              │ Service         │
              └───────┬────────┘              └────────┬────────┘              └────────┬────────┘
                      │                                │                                │
                      ▼                                ▼                                ▼
              ┌────────────────┐              ┌────────────────┐              ┌────────────────┐
              │ BadgeService   │              │ BadgeService   │              │ BadgeService   │
              │ grantBadge()   │              │ grantBadge()   │              │ grantBadge()   │
              └───────┬────────┘              └────────┬───────┘              └────────┬───────┘
                      │                                │                                │
                      └────────────────────────────────┼────────────────────────────────┘
                                                       │
                                                       ▼
                                              ┌────────────────┐
                                              │ Firestore      │
                                              │ users/{id}/    │
                                              │   badges/      │
                                              └────────┬───────┘
                                                       │
                                                       ▼
                                              ┌────────────────┐
                                              │ RewardActivity │
                                              │ Service        │
                                              └────────┬───────┘
                                                       │
                                                       ▼
                                              ┌────────────────┐
                                              │ Firestore      │
                                              │ users/{id}/    │
                                              │   activities/  │
                                              └────────────────┘
```

## Services Involved

### BadgeService
**Location:** `libs/server/progression-engine/src/lib/rewards/services/badge.service.ts`

Core service for granting badges:
- `grantBadge(userId, badgeId)` - Grants a badge if not already earned
- `hasBadge(userId, badgeId)` - Checks if user has a badge
- `getUserBadges(userId)` - Gets all badges for a user
- Handles duplicate prevention automatically

### MilestoneBadgeService
**Location:** `libs/server/progression-engine/src/lib/rewards/services/milestone-badge.service.ts`

Checks and grants milestone badges:
- Called after each activity is recorded
- Compares activity counts against thresholds
- Grants badge when threshold is exactly reached

### SpecialBadgeService
**Location:** `libs/server/progression-engine/src/lib/rewards/services/special-badge.service.ts`

Checks and grants time-based badges:
- Early Bird (before 7 AM)
- Night Owl (after 11 PM)
- Weekend Warrior (5 activities on weekend)
- Tracks weekend activity counts in subcollection

### RewardActivityService
**Location:** `libs/server/progression-engine/src/lib/rewards/services/reward-activity.service.ts`

Creates activity records for badges and level-ups:
- `recordBadgeEarned(userId, badge, trigger)` - Creates badge-earned activity
- `recordLevelUp(userId, prevLevel, newLevel, xp)` - Creates level-up activity
- Activities appear in the user's activity feed

## Firestore Storage

### Badge Documents
**Path:** `users/{userId}/badges/{badgeId}`

```typescript
interface UserBadge {
  id: string;           // Badge ID (e.g., "first_push")
  name: string;         // Display name
  description: string;  // Badge description
  icon: string;         // Emoji icon
  imageUrl?: string;    // Optional custom image
  rarity: BadgeRarity;  // COMMON, UNCOMMON, RARE, EPIC, LEGENDARY
  category: string;     // "level", "milestone", "special"
  earnedAt: string;     // ISO timestamp when earned
  metadata?: Record<string, unknown>;  // Additional data
}
```

### Badge Activity Documents
**Path:** `users/{userId}/activities/{activityId}`

```typescript
interface BadgeEarnedActivity {
  id: string;
  userId: string;
  type: 'badge-earned';
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: BadgeRarity;
    category: string;
  };
  trigger?: {
    type: 'level-up' | 'milestone' | 'special';
    level?: number;
    activityType?: string;
    count?: number;
  };
  userFacingDescription: string;
  createdAt: string;
  updatedAt: string;
  eventId: string;
  provider: 'system';
}
```

## Configuration Files

### Badge Catalog
**Location:** `libs/server/progression-engine/src/lib/config/badge-catalog.config.ts`

Central registry of all badges. Exports:
- `BADGE_CATALOG` - Record of all badge definitions
- `getBadgeDefinition(badgeId)` - Get a specific badge
- `getBadgesByCategory(category)` - Get all badges in a category
- `getBadgeForLevel(level)` - Get the badge for a level

### Milestone Badges Config
**Location:** `libs/server/progression-engine/src/lib/config/milestone-badges.config.ts`

Milestone badge definitions and helpers:
- `MILESTONE_BADGES` - All milestone badge definitions
- `MILESTONE_THRESHOLDS` - [1, 10, 25, 50, 100]
- `getMilestoneBadgeForCount(activityType, count)` - Get badge for a count

### Special Badges Config
**Location:** `libs/server/progression-engine/src/lib/config/special-badges.config.ts`

Special badge definitions and time helpers:
- `SPECIAL_BADGES` - All special badge definitions
- `isEarlyBird(timestamp)` - Check if before 7 AM
- `isNightOwl(timestamp)` - Check if after 11 PM
- `isWeekend(timestamp)` - Check if Saturday/Sunday

## Adding New Badges

### Adding a Level Badge

1. Add the badge definition in `badge-catalog.config.ts`:
```typescript
level_21_badge: {
  id: 'level_21_badge',
  name: 'New Level Name',
  description: 'Achievement description',
  icon: '🎯',
  rarity: BadgeRarity.LEGENDARY,
  category: 'level',
  metadata: { level: 21 },
},
```

2. Update level thresholds if needed in `level-thresholds.ts`

### Adding a Milestone Badge

1. Add the badge definition in `milestone-badges.config.ts`:
```typescript
push_200: {
  id: 'push_200',
  name: 'Push Legend',
  description: 'Pushed code 200 times',
  icon: '🌟',
  rarity: BadgeRarity.LEGENDARY,
  category: 'milestone',
  metadata: { activityType: 'code_push', threshold: 200 },
},
```

The system will automatically check this threshold when activities are recorded.

### Adding a Special Badge

1. Add the badge definition in `special-badges.config.ts`:
```typescript
friday_deploy: {
  id: 'friday_deploy',
  name: 'Friday Deploy',
  description: 'Published a release on a Friday',
  icon: '🎰',
  rarity: BadgeRarity.UNCOMMON,
  category: 'special',
  metadata: { trigger: 'friday_release' },
},
```

2. Add the check logic in `SpecialBadgeService.checkTimeBadges()`:
```typescript
if (this.isFriday(timestamp) && activity.sourceActionType === 'release_publish') {
  const badge = await this.grantBadgeIfNotEarned(userId, 'friday_deploy');
  if (badge) grantedBadges.push(badge);
}
```

## Frontend Display

Badges appear in:
1. **Activity Feed** - With gold glow styling for badge-earned activities
2. **User Profile** - Grid of earned badges
3. **Debug Panel** - Full activity JSON for development

The `activity-wall` app uses:
- `ACTIVITY_TYPE_DISPLAY` mapping for badge/level-up styling
- `getActivityTypeDisplay()` to get display config
- Type guards (`isBadgeEarnedActivity`, `isLevelUpActivity`) for type-safe rendering
