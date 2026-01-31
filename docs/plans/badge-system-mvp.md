# Badge System MVP - Ralph Execution Plan

## Overview

Implement a working badge system for CodeHeroes levels 1-20. Players earn badges when leveling up, and badges are displayed in the Activity Wall.

**Goal**: When a user levels up, they receive the badge(s) defined for that level, and these badges are visible in the Activity Wall UI.

## Current State Problems

1. `level-definitions.config.ts` defines badge IDs but badges are NEVER created
2. `BadgeService` has hardcoded milestones, no catalog
3. `MilestoneRewardService` exists but is NOT wired into the main flow
4. `EventProcessorService` creates "achievements" instead of badges for level-ups
5. No badge catalog with metadata (icon, description, rarity)

## Success Criteria

When complete, the following MUST work:

1. ✅ Badge catalog exists with all 21 level badges defined
2. ✅ When a user levels up, their level badge is created in Firestore `users/{id}/badges/{badgeId}`
3. ✅ Badge documents contain full metadata (name, description, icon, rarity, earnedAt)
4. ✅ Activity Wall displays user's earned badges with icons
5. ✅ All existing tests pass
6. ✅ No regression in XP/level-up functionality

---

## Phase 1: Badge Catalog

### Task 1.1: Create Badge Catalog Config

Create a new config file with all badge definitions.

**File**: `libs/server/progression-engine/src/lib/config/badge-catalog.config.ts`

```typescript
import { BadgeRarity } from '@codeheroes/types';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;           // Emoji for MVP
  imageUrl?: string;      // Future: custom image
  rarity: BadgeRarity;
  category: 'level' | 'milestone' | 'special';
  metadata?: {
    level?: number;       // For level badges
    threshold?: number;   // For milestone badges
  };
}

export const BADGE_CATALOG: Record<string, BadgeDefinition> = {
  // Level 1
  novice_coder: {
    id: 'novice_coder',
    name: 'Code Novice',
    description: 'Started your coding journey',
    icon: '🌱',
    rarity: BadgeRarity.COMMON,
    category: 'level',
    metadata: { level: 1 },
  },
  // Level 2
  code_initiate: {
    id: 'code_initiate',
    name: 'Code Initiate',
    description: 'Taking the first steps',
    icon: '🔰',
    rarity: BadgeRarity.COMMON,
    category: 'level',
    metadata: { level: 2 },
  },
  // Level 3
  code_apprentice: {
    id: 'code_apprentice',
    name: 'Code Apprentice',
    description: 'Learning the craft',
    icon: '📚',
    rarity: BadgeRarity.COMMON,
    category: 'level',
    metadata: { level: 3 },
  },
  // Level 4
  code_student: {
    id: 'code_student',
    name: 'Code Student',
    description: 'Dedicated to improvement',
    icon: '✏️',
    rarity: BadgeRarity.COMMON,
    category: 'level',
    metadata: { level: 4 },
  },
  // Level 5
  code_explorer: {
    id: 'code_explorer',
    name: 'Code Explorer',
    description: 'Venturing into new territories',
    icon: '🧭',
    rarity: BadgeRarity.UNCOMMON,
    category: 'level',
    metadata: { level: 5 },
  },
  // Level 6
  code_adventurer: {
    id: 'code_adventurer',
    name: 'Code Adventurer',
    description: 'Embracing the challenge',
    icon: '⚔️',
    rarity: BadgeRarity.UNCOMMON,
    category: 'level',
    metadata: { level: 6 },
  },
  // Level 7
  code_adept: {
    id: 'code_adept',
    name: 'Code Adept',
    description: 'Skilled in the art of coding',
    icon: '🎯',
    rarity: BadgeRarity.UNCOMMON,
    category: 'level',
    metadata: { level: 7 },
  },
  // Level 8
  code_enthusiast: {
    id: 'code_enthusiast',
    name: 'Code Enthusiast',
    description: 'Passionate about code',
    icon: '🔥',
    rarity: BadgeRarity.UNCOMMON,
    category: 'level',
    metadata: { level: 8 },
  },
  // Level 9
  code_practitioner: {
    id: 'code_practitioner',
    name: 'Code Practitioner',
    description: 'Putting skills into practice',
    icon: '🛠️',
    rarity: BadgeRarity.UNCOMMON,
    category: 'level',
    metadata: { level: 9 },
  },
  // Level 10
  code_hero: {
    id: 'code_hero',
    name: 'Code Hero',
    description: 'A true coding hero!',
    icon: '🦸',
    rarity: BadgeRarity.RARE,
    category: 'level',
    metadata: { level: 10 },
  },
  // Level 11
  code_warrior: {
    id: 'code_warrior',
    name: 'Code Warrior',
    description: 'Fighting bugs with honor',
    icon: '⚡',
    rarity: BadgeRarity.RARE,
    category: 'level',
    metadata: { level: 11 },
  },
  // Level 12
  code_veteran: {
    id: 'code_veteran',
    name: 'Code Veteran',
    description: 'Battle-tested developer',
    icon: '🎖️',
    rarity: BadgeRarity.RARE,
    category: 'level',
    metadata: { level: 12 },
  },
  // Level 13
  code_specialist: {
    id: 'code_specialist',
    name: 'Code Specialist',
    description: 'Expert in your domain',
    icon: '🔬',
    rarity: BadgeRarity.RARE,
    category: 'level',
    metadata: { level: 13 },
  },
  // Level 14
  code_expert: {
    id: 'code_expert',
    name: 'Code Expert',
    description: 'Mastery recognized',
    icon: '💎',
    rarity: BadgeRarity.RARE,
    category: 'level',
    metadata: { level: 14 },
  },
  // Level 15
  code_master: {
    id: 'code_master',
    name: 'Code Master',
    description: 'Master of the craft',
    icon: '👑',
    rarity: BadgeRarity.EPIC,
    category: 'level',
    metadata: { level: 15 },
  },
  // Level 16
  code_sage: {
    id: 'code_sage',
    name: 'Code Sage',
    description: 'Wisdom through experience',
    icon: '🧙',
    rarity: BadgeRarity.EPIC,
    category: 'level',
    metadata: { level: 16 },
  },
  // Level 17
  code_legend: {
    id: 'code_legend',
    name: 'Code Legend',
    description: 'Your name echoes in the halls',
    icon: '⭐',
    rarity: BadgeRarity.EPIC,
    category: 'level',
    metadata: { level: 17 },
  },
  // Level 18
  code_champion: {
    id: 'code_champion',
    name: 'Code Champion',
    description: 'Champion of clean code',
    icon: '🏅',
    rarity: BadgeRarity.EPIC,
    category: 'level',
    metadata: { level: 18 },
  },
  // Level 19
  code_oracle: {
    id: 'code_oracle',
    name: 'Code Oracle',
    description: 'Sees the patterns others miss',
    icon: '🔮',
    rarity: BadgeRarity.EPIC,
    category: 'level',
    metadata: { level: 19 },
  },
  // Level 20
  code_architect: {
    id: 'code_architect',
    name: 'Code Architect',
    description: 'Builder of systems',
    icon: '🏆',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 20 },
  },
  // Level 20 Mastery (bonus badge)
  level_20_mastery: {
    id: 'level_20_mastery',
    name: 'Level 20 Mastery',
    description: 'Achieved maximum level in the onboarding phase',
    icon: '🎓',
    rarity: BadgeRarity.LEGENDARY,
    category: 'level',
    metadata: { level: 20 },
  },
};

/**
 * Get a badge definition by ID
 */
export function getBadgeDefinition(badgeId: string): BadgeDefinition | undefined {
  return BADGE_CATALOG[badgeId];
}

/**
 * Get all badges for a specific category
 */
export function getBadgesByCategory(category: BadgeDefinition['category']): BadgeDefinition[] {
  return Object.values(BADGE_CATALOG).filter(badge => badge.category === category);
}

/**
 * Get the badge for a specific level
 */
export function getBadgeForLevel(level: number): BadgeDefinition | undefined {
  return Object.values(BADGE_CATALOG).find(
    badge => badge.category === 'level' && badge.metadata?.level === level
  );
}
```

### Task 1.2: Update Badge Types

Update the types to match the new structure.

**File**: `libs/types/src/lib/gamification/badges.types.ts`

Ensure `BadgeRarity` enum exists and is exported:

```typescript
export enum BadgeRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export enum BadgeCategory {
  LEVEL = 'level',
  MILESTONE = 'milestone',
  SPECIAL = 'special',
}

/**
 * Badge as stored in Firestore (users/{id}/badges/{badgeId})
 */
export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageUrl?: string;
  rarity: BadgeRarity;
  category: BadgeCategory | string;
  earnedAt: string;
  metadata?: Record<string, unknown>;
}
```

### Task 1.3: Export from progression-engine

Update the barrel export to include the badge catalog.

**File**: `libs/server/progression-engine/src/index.ts`

Add export:
```typescript
export * from './lib/config/badge-catalog.config';
```

**Acceptance Criteria Phase 1:**
- [ ] `badge-catalog.config.ts` exists with all 21 badges
- [ ] `getBadgeDefinition(badgeId)` returns correct badge
- [ ] `getBadgeForLevel(level)` returns correct badge for levels 1-20
- [ ] Types compile without errors

---

## Phase 2: Badge Service Refactor

### Task 2.1: Refactor BadgeService

Rewrite `BadgeService` to use the catalog and have a clean interface.

**File**: `libs/server/progression-engine/src/lib/rewards/services/badge.service.ts`

```typescript
import { DatabaseInstance, logger } from '@codeheroes/common';
import { Collections, UserBadge, BadgeRarity } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { getBadgeDefinition, BadgeDefinition } from '../../config/badge-catalog.config';

export class BadgeService {
  private db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  /**
   * Grant a badge to a user by badge ID
   * Looks up the badge in the catalog and creates it in Firestore
   * Returns false if badge already earned or not found in catalog
   */
  async grantBadge(userId: string, badgeId: string): Promise<UserBadge | null> {
    // 1. Check if badge exists in catalog
    const badgeDefinition = getBadgeDefinition(badgeId);
    if (!badgeDefinition) {
      logger.warn('Badge not found in catalog', { badgeId });
      return null;
    }

    // 2. Check if user already has this badge
    if (await this.hasBadge(userId, badgeId)) {
      logger.info('User already has badge', { userId, badgeId });
      return null;
    }

    // 3. Create the badge document
    const userBadge: UserBadge = {
      id: badgeDefinition.id,
      name: badgeDefinition.name,
      description: badgeDefinition.description,
      icon: badgeDefinition.icon,
      imageUrl: badgeDefinition.imageUrl,
      rarity: badgeDefinition.rarity,
      category: badgeDefinition.category,
      earnedAt: new Date().toISOString(),
      metadata: badgeDefinition.metadata,
    };

    // 4. Save to Firestore
    const badgeRef = this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Badges)
      .doc(badgeId);

    await badgeRef.set(userBadge);

    logger.info('Badge granted', { userId, badgeId, badgeName: userBadge.name });

    return userBadge;
  }

  /**
   * Grant multiple badges to a user
   */
  async grantBadges(userId: string, badgeIds: string[]): Promise<UserBadge[]> {
    const granted: UserBadge[] = [];

    for (const badgeId of badgeIds) {
      const badge = await this.grantBadge(userId, badgeId);
      if (badge) {
        granted.push(badge);
      }
    }

    return granted;
  }

  /**
   * Check if a user has a specific badge
   */
  async hasBadge(userId: string, badgeId: string): Promise<boolean> {
    const badgeRef = this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Badges)
      .doc(badgeId);

    const doc = await badgeRef.get();
    return doc.exists;
  }

  /**
   * Get all badges for a user
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const snapshot = await this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Badges)
      .orderBy('earnedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as UserBadge);
  }

  /**
   * Get badge count for a user
   */
  async getBadgeCount(userId: string): Promise<number> {
    const snapshot = await this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Badges)
      .count()
      .get();

    return snapshot.data().count;
  }
}
```

### Task 2.2: Remove Old Badge Logic

Remove the old `processBadges` and `checkActivityBadges` methods. They are no longer needed since we're using the catalog-based approach.

**Acceptance Criteria Phase 2:**
- [ ] `BadgeService.grantBadge(userId, badgeId)` works correctly
- [ ] Duplicate badges are prevented
- [ ] `getUserBadges` returns badges with full metadata
- [ ] Old hardcoded milestone logic is removed

---

## Phase 3: Level-up Badge Integration

### Task 3.1: Update Level-up Event Handler

Modify the level-up flow to grant badges from the level definitions.

**File**: `libs/server/progression-engine/src/lib/progression/events/event-processor.service.ts`

Update `handleLevelUp` method:

```typescript
import { BadgeService } from '../../rewards/services/badge.service';
import { getLevelRequirements } from '../../config/level-thresholds';

// In constructor, add:
private badgeService: BadgeService;

constructor() {
  // ... existing code ...
  this.badgeService = new BadgeService();
}

private async handleLevelUp(event: ProgressionEvent): Promise<void> {
  const { userId, data } = event;
  const newLevel = data.state?.level;
  const previousLevel = data.previousState?.level || 0;

  if (!newLevel) return;

  // Grant badges for ALL levels gained (handles multiple level-ups)
  for (let level = previousLevel + 1; level <= newLevel; level++) {
    const levelConfig = getLevelRequirements(level);

    if (levelConfig?.rewards?.badges) {
      const grantedBadges = await this.badgeService.grantBadges(userId, levelConfig.rewards.badges);

      // Send notification for each granted badge
      for (const badge of grantedBadges) {
        await this.notificationService.createNotification(userId, {
          type: 'BADGE_EARNED',
          title: 'New Badge Earned!',
          message: `You earned: ${badge.icon} ${badge.name}`,
          metadata: { badgeId: badge.id, level },
        });
      }
    }
  }

  // Send level-up notification
  await this.notificationService.createNotification(userId, {
    type: 'LEVEL_UP',
    title: 'Level Up!',
    message: `Congratulations! You've reached level ${newLevel}!`,
    metadata: { level: newLevel, previousLevel },
  });
}
```

### Task 3.2: Remove Achievement Creation from Level-up

Remove the old achievement creation logic from `handleLevelUp` that creates documents in the `achievements` collection. The badge system now handles this.

### Task 3.3: Ensure Level Definitions Have Correct Badge IDs

Verify that `level-definitions.config.ts` badge IDs match the catalog:

- Level 1: `novice_coder`
- Level 2: `code_initiate`
- Level 3: `code_apprentice`
- ... etc (already correct based on analysis)

**Acceptance Criteria Phase 3:**
- [ ] Level-up triggers badge creation
- [ ] Badges appear in `users/{id}/badges` collection
- [ ] Multi-level jumps grant all intermediate badges
- [ ] Notifications are sent for each badge

---

## Phase 4: Cleanup

### Task 4.1: Remove Duplicate Achievement Logic

In `event-processor.service.ts`, remove or comment out the achievement creation for level-related items in `handleLevelUp`. Keep achievement logic for other purposes if needed.

### Task 4.2: Clean Up RewardService

The `RewardService.grantReward()` BADGE case needs to be updated to use the new `BadgeService.grantBadge()`:

**File**: `libs/server/progression-engine/src/lib/rewards/services/reward.service.ts`

```typescript
case 'BADGE':
  if (reward.id) {
    await this.badgeService.grantBadge(userId, reward.id);
  }
  break;
```

### Task 4.3: Update MilestoneRewardService (Optional)

Since we're handling badges in the event processor now, evaluate if `MilestoneRewardService` is still needed. If not used, add a comment indicating it's for future activity milestone badges.

### Task 4.4: Run Existing Tests

Run all tests to ensure nothing is broken:

```bash
nx test progression-engine
nx test game-engine
```

Fix any failing tests.

**Acceptance Criteria Phase 4:**
- [ ] No duplicate badge/achievement creation
- [ ] `RewardService` BADGE case uses new `BadgeService`
- [ ] All existing tests pass
- [ ] No TypeScript errors

---

## Phase 5: Frontend Badge Display

### Task 5.1: Create Badge Display Component

Add badge display to the Activity Wall.

**File**: `apps/frontend/app/src/app/components/badges/badge-list.component.ts`

Create a component that:
1. Fetches user badges from Firestore
2. Displays badges in a grid with icons
3. Shows badge name on hover

### Task 5.2: Add Badge Section to Profile/HQ

Integrate the badge display into the existing Activity Wall UI. Find the appropriate location (likely the user profile section or HQ page).

### Task 5.3: Style the Badges

Add appropriate styling:
- Badge icons should be visible and appropriately sized
- Rarity should be indicated (e.g., border color or glow)
- Earned date shown on hover/click

**Acceptance Criteria Phase 5:**
- [ ] Badges are visible in Activity Wall
- [ ] Badge icon (emoji) is displayed
- [ ] Badge name is shown
- [ ] Rarity is visually indicated

---

## Phase 6: Verification

### Task 6.1: Clear Test Data

Clear any existing badges from the test user to start fresh:

```bash
# Via Firestore UI at http://localhost:4000/firestore
# Navigate to users/1000002/badges and delete all documents
```

### Task 6.2: Simulate Level-ups

Use the GitHub simulator to trigger events that give XP:

```bash
# Multiple pushes to gain XP and level up
nx serve github-simulator -- push
nx serve github-simulator -- push
nx serve github-simulator -- pr open
nx serve github-simulator -- pr merge --number 1
```

### Task 6.3: Verify in Firestore

Check the Emulator UI at `http://localhost:4000/firestore`:
1. Navigate to `users/1000002/badges`
2. Verify badge documents exist with correct structure:
   - `id`, `name`, `description`, `icon`, `rarity`, `category`, `earnedAt`

### Task 6.4: Verify in Activity Wall

Open `http://localhost:4201` in browser:
1. Log in as test user (Nightcrawler)
2. Navigate to profile/badges section
3. Verify badges are displayed with icons
4. Take a screenshot as proof

### Task 6.5: Test Multi-Level Jump

Give the user a large amount of XP to trigger multiple level-ups at once:

```bash
# Create a test that grants significant XP
# Verify ALL intermediate badges are granted
```

**Acceptance Criteria Phase 6:**
- [ ] Firestore contains badge documents with correct structure
- [ ] Activity Wall displays badges visually
- [ ] Multi-level jumps grant all badges
- [ ] Screenshot taken as verification

---

## Completion Checklist

Before outputting completion promise, verify ALL of the following:

1. [ ] Badge catalog config file exists with 21 badges
2. [ ] BadgeService refactored with clean interface
3. [ ] Level-up flow grants badges correctly
4. [ ] Badges stored in Firestore with full metadata
5. [ ] Activity Wall displays badges
6. [ ] All tests pass
7. [ ] Visual verification in browser completed
8. [ ] Screenshot taken of badges in UI

---

## Completion Promise

When ALL success criteria are met and verified:

```
<promise>BADGE_SYSTEM_MVP_COMPLETE</promise>
```

---

## Files to Create/Modify

### New Files:
- `libs/server/progression-engine/src/lib/config/badge-catalog.config.ts`
- `apps/frontend/app/src/app/components/badges/badge-list.component.ts` (or similar)

### Modified Files:
- `libs/types/src/lib/gamification/badges.types.ts`
- `libs/server/progression-engine/src/index.ts`
- `libs/server/progression-engine/src/lib/rewards/services/badge.service.ts`
- `libs/server/progression-engine/src/lib/rewards/services/reward.service.ts`
- `libs/server/progression-engine/src/lib/progression/events/event-processor.service.ts`
- Activity Wall UI components (location TBD based on current structure)

---

## Notes for Ralph

1. **Test after each phase** - Don't wait until the end
2. **Check emulator logs** - Look for errors in the Firebase emulator output
3. **Use DevTools MCP** - For browser verification, use `mcp__devtools-mcp__take_screenshot`
4. **App structure** - Explore `apps/frontend/app/src/app` to understand current component structure before adding badge display
5. **Firestore rules** - Badge collection should be readable by the user (check existing rules)
