# Activity Milestone Badges - Ralph Execution Plan

## Overview

Implement activity-based milestone badges that reward players for reaching activity count thresholds. Building on the Level Badge system (Option A), this adds badges for achievements like "First PR", "10 Code Pushes", "50 Code Reviews", etc.

**Goal**: When a user performs an activity that crosses a milestone threshold, they receive the corresponding milestone badge.

## Current State

**Already Working (from Option A):**
- Badge catalog infrastructure (`badge-catalog.config.ts`)
- `BadgeService.grantBadge()` and `grantBadges()`
- Frontend badge display in Activity Wall
- Notification system for badge earned

**Hook Point Ready:**
- `handleActivityRecorded()` in `event-processor.service.ts` has placeholder comment: `// Future: Add activity milestone badges here (Option B)`

**Activity Counters Tracked:**
```typescript
// From progression.repository.ts getInitialCounters()
code_push: 0,
pull_request_create: 0,
pull_request_merge: 0,
pull_request_close: 0,
code_review_submit: 0,
code_review_comment: 0,
issue_create: 0,
issue_close: 0,
issue_reopen: 0,
comment_create: 0,
review_comment_create: 0,
release_publish: 0,
ci_success: 0,
discussion_create: 0,
discussion_comment: 0,
```

## Success Criteria

When complete, the following MUST work:

1. [x] Milestone badge catalog exists with all milestone badges defined
2. [x] When activity count crosses a threshold, badge is granted
3. [x] "First X" badges work (threshold = 1)
4. [x] Milestone badges work (10, 25, 50, 100)
5. [x] Badges appear in Activity Wall immediately after earning
6. [x] No duplicate badges on repeated activities
7. [x] All existing tests pass

---

## Phase 1: Define Milestone Badge Catalog

### Task 1.1: Create Milestone Badges Config

Add milestone badges to the badge catalog. Group by activity type with progressive thresholds.

**File**: `libs/server/progression-engine/src/lib/config/milestone-badges.config.ts`

```typescript
import { BadgeDefinition } from './badge-catalog.config';
import { BadgeRarity } from '@codeheroes/types';

/**
 * Milestone thresholds for activity badges
 */
export const MILESTONE_THRESHOLDS = [1, 10, 25, 50, 100] as const;

/**
 * Activity types that have milestone badges
 */
export type MilestoneActivityType =
  | 'code_push'
  | 'pull_request_create'
  | 'pull_request_merge'
  | 'code_review_submit'
  | 'issue_create'
  | 'release_publish';

/**
 * Milestone badge definitions
 */
export const MILESTONE_BADGES: Record<string, BadgeDefinition> = {
  // ═══════════════════════════════════════════════════════════════════
  // CODE PUSH MILESTONES
  // ═══════════════════════════════════════════════════════════════════
  first_push: {
    id: 'first_push',
    name: 'First Push',
    description: 'Pushed code for the first time',
    icon: '🚀',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'code_push', threshold: 1 },
  },
  push_10: {
    id: 'push_10',
    name: 'Push Rookie',
    description: 'Pushed code 10 times',
    icon: '📤',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'code_push', threshold: 10 },
  },
  push_25: {
    id: 'push_25',
    name: 'Push Regular',
    description: 'Pushed code 25 times',
    icon: '📦',
    rarity: BadgeRarity.UNCOMMON,
    category: 'milestone',
    metadata: { activityType: 'code_push', threshold: 25 },
  },
  push_50: {
    id: 'push_50',
    name: 'Push Pro',
    description: 'Pushed code 50 times',
    icon: '🎯',
    rarity: BadgeRarity.RARE,
    category: 'milestone',
    metadata: { activityType: 'code_push', threshold: 50 },
  },
  push_100: {
    id: 'push_100',
    name: 'Push Master',
    description: 'Pushed code 100 times',
    icon: '💫',
    rarity: BadgeRarity.EPIC,
    category: 'milestone',
    metadata: { activityType: 'code_push', threshold: 100 },
  },

  // ═══════════════════════════════════════════════════════════════════
  // PULL REQUEST CREATE MILESTONES
  // ═══════════════════════════════════════════════════════════════════
  first_pr: {
    id: 'first_pr',
    name: 'First PR',
    description: 'Created your first pull request',
    icon: '🎉',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'pull_request_create', threshold: 1 },
  },
  pr_10: {
    id: 'pr_10',
    name: 'PR Contributor',
    description: 'Created 10 pull requests',
    icon: '🔀',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'pull_request_create', threshold: 10 },
  },
  pr_25: {
    id: 'pr_25',
    name: 'PR Regular',
    description: 'Created 25 pull requests',
    icon: '🔃',
    rarity: BadgeRarity.UNCOMMON,
    category: 'milestone',
    metadata: { activityType: 'pull_request_create', threshold: 25 },
  },
  pr_50: {
    id: 'pr_50',
    name: 'PR Pro',
    description: 'Created 50 pull requests',
    icon: '⚡',
    rarity: BadgeRarity.RARE,
    category: 'milestone',
    metadata: { activityType: 'pull_request_create', threshold: 50 },
  },
  pr_100: {
    id: 'pr_100',
    name: 'PR Legend',
    description: 'Created 100 pull requests',
    icon: '🏆',
    rarity: BadgeRarity.EPIC,
    category: 'milestone',
    metadata: { activityType: 'pull_request_create', threshold: 100 },
  },

  // ═══════════════════════════════════════════════════════════════════
  // PULL REQUEST MERGE MILESTONES
  // ═══════════════════════════════════════════════════════════════════
  first_merge: {
    id: 'first_merge',
    name: 'First Merge',
    description: 'Merged your first pull request',
    icon: '🎊',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'pull_request_merge', threshold: 1 },
  },
  merge_10: {
    id: 'merge_10',
    name: 'Merger',
    description: 'Merged 10 pull requests',
    icon: '🔗',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'pull_request_merge', threshold: 10 },
  },
  merge_25: {
    id: 'merge_25',
    name: 'Integration Expert',
    description: 'Merged 25 pull requests',
    icon: '🔧',
    rarity: BadgeRarity.UNCOMMON,
    category: 'milestone',
    metadata: { activityType: 'pull_request_merge', threshold: 25 },
  },
  merge_50: {
    id: 'merge_50',
    name: 'Merge Master',
    description: 'Merged 50 pull requests',
    icon: '⚙️',
    rarity: BadgeRarity.RARE,
    category: 'milestone',
    metadata: { activityType: 'pull_request_merge', threshold: 50 },
  },
  merge_100: {
    id: 'merge_100',
    name: 'Merge Legend',
    description: 'Merged 100 pull requests',
    icon: '👑',
    rarity: BadgeRarity.EPIC,
    category: 'milestone',
    metadata: { activityType: 'pull_request_merge', threshold: 100 },
  },

  // ═══════════════════════════════════════════════════════════════════
  // CODE REVIEW MILESTONES
  // ═══════════════════════════════════════════════════════════════════
  first_review: {
    id: 'first_review',
    name: 'First Review',
    description: 'Submitted your first code review',
    icon: '👀',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'code_review_submit', threshold: 1 },
  },
  review_10: {
    id: 'review_10',
    name: 'Reviewer',
    description: 'Submitted 10 code reviews',
    icon: '🔍',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'code_review_submit', threshold: 10 },
  },
  review_25: {
    id: 'review_25',
    name: 'Quality Guardian',
    description: 'Submitted 25 code reviews',
    icon: '🛡️',
    rarity: BadgeRarity.UNCOMMON,
    category: 'milestone',
    metadata: { activityType: 'code_review_submit', threshold: 25 },
  },
  review_50: {
    id: 'review_50',
    name: 'Review Expert',
    description: 'Submitted 50 code reviews',
    icon: '🎓',
    rarity: BadgeRarity.RARE,
    category: 'milestone',
    metadata: { activityType: 'code_review_submit', threshold: 50 },
  },
  review_100: {
    id: 'review_100',
    name: 'Review Master',
    description: 'Submitted 100 code reviews',
    icon: '🏅',
    rarity: BadgeRarity.EPIC,
    category: 'milestone',
    metadata: { activityType: 'code_review_submit', threshold: 100 },
  },

  // ═══════════════════════════════════════════════════════════════════
  // ISSUE MILESTONES
  // ═══════════════════════════════════════════════════════════════════
  first_issue: {
    id: 'first_issue',
    name: 'First Issue',
    description: 'Created your first issue',
    icon: '📝',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'issue_create', threshold: 1 },
  },
  issue_10: {
    id: 'issue_10',
    name: 'Issue Reporter',
    description: 'Created 10 issues',
    icon: '🐛',
    rarity: BadgeRarity.COMMON,
    category: 'milestone',
    metadata: { activityType: 'issue_create', threshold: 10 },
  },
  issue_25: {
    id: 'issue_25',
    name: 'Bug Hunter',
    description: 'Created 25 issues',
    icon: '🔎',
    rarity: BadgeRarity.UNCOMMON,
    category: 'milestone',
    metadata: { activityType: 'issue_create', threshold: 25 },
  },
  issue_50: {
    id: 'issue_50',
    name: 'Issue Expert',
    description: 'Created 50 issues',
    icon: '📋',
    rarity: BadgeRarity.RARE,
    category: 'milestone',
    metadata: { activityType: 'issue_create', threshold: 50 },
  },

  // ═══════════════════════════════════════════════════════════════════
  // RELEASE MILESTONES
  // ═══════════════════════════════════════════════════════════════════
  first_release: {
    id: 'first_release',
    name: 'First Release',
    description: 'Published your first release',
    icon: '🎁',
    rarity: BadgeRarity.UNCOMMON,
    category: 'milestone',
    metadata: { activityType: 'release_publish', threshold: 1 },
  },
  release_10: {
    id: 'release_10',
    name: 'Release Manager',
    description: 'Published 10 releases',
    icon: '📦',
    rarity: BadgeRarity.RARE,
    category: 'milestone',
    metadata: { activityType: 'release_publish', threshold: 10 },
  },
  release_25: {
    id: 'release_25',
    name: 'Release Pro',
    description: 'Published 25 releases',
    icon: '🚢',
    rarity: BadgeRarity.EPIC,
    category: 'milestone',
    metadata: { activityType: 'release_publish', threshold: 25 },
  },
};

/**
 * Get milestone badges for a specific activity type
 */
export function getMilestoneBadgesForActivity(activityType: string): BadgeDefinition[] {
  return Object.values(MILESTONE_BADGES).filter(
    badge => badge.metadata?.activityType === activityType
  );
}

/**
 * Get the badge to award for crossing a milestone
 * Returns the badge if the new count exactly matches a threshold
 */
export function getMilestoneBadgeForCount(
  activityType: string,
  count: number
): BadgeDefinition | undefined {
  return Object.values(MILESTONE_BADGES).find(
    badge =>
      badge.metadata?.activityType === activityType &&
      badge.metadata?.threshold === count
  );
}

/**
 * Get all milestone badges a user should have based on their counts
 * Useful for backfilling or verifying badges
 */
export function getAllEarnedMilestoneBadges(
  activityType: string,
  count: number
): BadgeDefinition[] {
  return Object.values(MILESTONE_BADGES).filter(
    badge =>
      badge.metadata?.activityType === activityType &&
      badge.metadata?.threshold !== undefined &&
      count >= badge.metadata.threshold
  );
}
```

### Task 1.2: Merge Milestone Badges into Main Catalog

Update `badge-catalog.config.ts` to include milestone badges.

**File**: `libs/server/progression-engine/src/lib/config/badge-catalog.config.ts`

```typescript
import { LEVEL_BADGES } from './level-badges.config';
import { MILESTONE_BADGES } from './milestone-badges.config';

// Merge all badge catalogs
export const BADGE_CATALOG: Record<string, BadgeDefinition> = {
  ...LEVEL_BADGES,
  ...MILESTONE_BADGES,
};
```

### Task 1.3: Export from Index

**File**: `libs/server/progression-engine/src/index.ts`

Add export:
```typescript
export * from './lib/config/milestone-badges.config';
```

**Acceptance Criteria Phase 1:**
- [ ] `milestone-badges.config.ts` exists with all milestone badges
- [ ] `getMilestoneBadgeForCount(activityType, count)` returns correct badge
- [ ] Badges merged into main catalog
- [ ] TypeScript compiles without errors

---

## Phase 2: Implement Milestone Checking

### Task 2.1: Create MilestoneBadgeService

Create a service to check and grant milestone badges.

**File**: `libs/server/progression-engine/src/lib/rewards/services/milestone-badge.service.ts`

```typescript
import { logger } from '@codeheroes/common';
import { UserBadge } from '@codeheroes/types';
import { BadgeService } from './badge.service';
import { getMilestoneBadgeForCount } from '../../config/milestone-badges.config';

export class MilestoneBadgeService {
  private badgeService: BadgeService;

  constructor(badgeService?: BadgeService) {
    this.badgeService = badgeService || new BadgeService();
  }

  /**
   * Check if an activity count milestone was reached and grant badge
   * @param userId User ID
   * @param activityType The type of activity (e.g., 'code_push', 'pull_request_create')
   * @param newCount The NEW count after the activity was recorded
   * @returns Granted badge or null if no milestone reached
   */
  async checkAndGrantMilestoneBadge(
    userId: string,
    activityType: string,
    newCount: number
  ): Promise<UserBadge | null> {
    // Check if this exact count matches a milestone threshold
    const milestoneBadge = getMilestoneBadgeForCount(activityType, newCount);

    if (!milestoneBadge) {
      // No milestone at this count
      return null;
    }

    logger.info('Milestone reached, granting badge', {
      userId,
      activityType,
      count: newCount,
      badgeId: milestoneBadge.id,
    });

    // Grant the badge (BadgeService handles duplicate prevention)
    return this.badgeService.grantBadge(userId, milestoneBadge.id);
  }
}
```

### Task 2.2: Update EventProcessorService

Implement the milestone checking in `handleActivityRecorded`.

**File**: `libs/server/progression-engine/src/lib/progression/events/event-processor.service.ts`

```typescript
import { MilestoneBadgeService } from '../../rewards/services/milestone-badge.service';

// Add to constructor:
private milestoneBadgeService: MilestoneBadgeService;

constructor() {
  // ... existing code ...
  this.milestoneBadgeService = new MilestoneBadgeService(this.badgeService);
}

// Update handleActivityRecorded:
private async handleActivityRecorded(event: ProgressionEvent): Promise<void> {
  const { userId, data } = event;
  const activity = data.activity;
  const state = data.state;

  if (!activity || !state) return;

  const activityType = activity.sourceActionType;
  const newCount = state.counters?.actions?.[activityType];

  if (newCount === undefined) {
    logger.warn('Activity count not found in state', { userId, activityType });
    return;
  }

  logger.info('Checking milestone badges', { userId, activityType, count: newCount });

  // Check and grant milestone badge if threshold reached
  const grantedBadge = await this.milestoneBadgeService.checkAndGrantMilestoneBadge(
    userId,
    activityType,
    newCount
  );

  if (grantedBadge) {
    // Send notification for the new badge
    await this.notificationService.createNotification(userId, {
      type: 'BADGE_EARNED',
      title: 'Milestone Reached!',
      message: `You earned: ${grantedBadge.icon} ${grantedBadge.name}`,
      metadata: {
        badgeId: grantedBadge.id,
        activityType,
        count: newCount,
      },
    });
  }
}
```

### Task 2.3: Ensure State Contains Counter

The `ACTIVITY_RECORDED` event needs to include the updated state with counters. Verify this is happening in the progression service.

Check `libs/server/progression-engine/src/lib/progression/services/progression.service.ts` to ensure the event includes `data.state` with `counters.actions`.

**Acceptance Criteria Phase 2:**
- [ ] `MilestoneBadgeService` created
- [ ] `handleActivityRecorded` checks for milestone badges
- [ ] Badge is granted when threshold is crossed
- [ ] Notification is sent for new milestone badge

---

## Phase 3: Verification

### Task 3.1: Clear Test Data

Clear any existing milestone badges:
```bash
# Via Firestore UI at http://localhost:4000/firestore
# Navigate to users/1000002/badges and delete milestone badges if any
```

### Task 3.2: Simulate First Activity

Test the "first X" milestones:

```bash
# Clear the user's progression state first (optional - for clean test)
# Then simulate first push
nx serve github-simulator -- push
```

Check Firestore for:
- Badge document `users/1000002/badges/first_push`

### Task 3.3: Simulate Multiple Activities

Simulate enough activities to cross a milestone:

```bash
# Simulate 10 pushes to earn push_10 badge
for i in {1..10}; do
  nx serve github-simulator -- push
  sleep 2
done
```

### Task 3.4: Verify in Activity Wall

1. Open http://localhost:4201
2. Log in as Nightcrawler
3. Check profile badges section
4. Verify milestone badges appear with correct icons

### Task 3.5: Verify No Duplicates

Run the same simulation again:
```bash
nx serve github-simulator -- push
```

Verify:
- No duplicate badge created
- Function logs show "User already has badge"

**Acceptance Criteria Phase 3:**
- [ ] First activity grants "first_X" badge
- [ ] Reaching threshold grants milestone badge
- [ ] Badges visible in Activity Wall
- [ ] No duplicate badges created

---

## Phase 4: Edge Cases & Polish

### Task 4.1: Handle Missing Counters

Ensure graceful handling when counters are missing or malformed.

### Task 4.2: Backfill Existing Users (Optional)

Create a utility to backfill milestone badges for users who already have activity counts:

```typescript
// Optional utility for backfilling
async function backfillMilestoneBadges(userId: string): Promise<UserBadge[]> {
  const state = await progressionRepository.getState(userId);
  const grantedBadges: UserBadge[] = [];

  for (const [activityType, count] of Object.entries(state.counters?.actions || {})) {
    const earnedBadges = getAllEarnedMilestoneBadges(activityType, count as number);
    for (const badge of earnedBadges) {
      const granted = await badgeService.grantBadge(userId, badge.id);
      if (granted) grantedBadges.push(granted);
    }
  }

  return grantedBadges;
}
```

### Task 4.3: Run Tests

```bash
nx test progression-engine
nx test game-engine
```

Fix any failing tests.

**Acceptance Criteria Phase 4:**
- [ ] Missing counters handled gracefully
- [ ] All tests pass
- [ ] No TypeScript errors

---

## Badge Summary

| Activity Type | First | 10 | 25 | 50 | 100 |
|---------------|-------|----|----|----|----|
| code_push | 🚀 First Push | 📤 Push Rookie | 📦 Push Regular | 🎯 Push Pro | 💫 Push Master |
| pull_request_create | 🎉 First PR | 🔀 PR Contributor | 🔃 PR Regular | ⚡ PR Pro | 🏆 PR Legend |
| pull_request_merge | 🎊 First Merge | 🔗 Merger | 🔧 Integration Expert | ⚙️ Merge Master | 👑 Merge Legend |
| code_review_submit | 👀 First Review | 🔍 Reviewer | 🛡️ Quality Guardian | 🎓 Review Expert | 🏅 Review Master |
| issue_create | 📝 First Issue | 🐛 Issue Reporter | 🔎 Bug Hunter | 📋 Issue Expert | - |
| release_publish | 🎁 First Release | 📦 Release Manager | 🚢 Release Pro | - | - |

**Total: 28 milestone badges**

---

## Completion Checklist

Before outputting completion promise, verify ALL of the following:

1. [ ] Milestone badge catalog config file exists
2. [ ] MilestoneBadgeService created and working
3. [ ] handleActivityRecorded checks milestones
4. [ ] "First X" badges work
5. [ ] Threshold milestones work
6. [ ] Badges appear in Activity Wall
7. [ ] No duplicate badges
8. [ ] All tests pass

---

## Completion Promise

When ALL success criteria are met and verified:

```
<promise>ACTIVITY_MILESTONE_BADGES_COMPLETE</promise>
```

---

## Files to Create/Modify

### New Files:
- `libs/server/progression-engine/src/lib/config/milestone-badges.config.ts`
- `libs/server/progression-engine/src/lib/rewards/services/milestone-badge.service.ts`

### Modified Files:
- `libs/server/progression-engine/src/lib/config/badge-catalog.config.ts` (merge catalogs)
- `libs/server/progression-engine/src/index.ts` (export new config)
- `libs/server/progression-engine/src/lib/progression/events/event-processor.service.ts` (implement milestone checking)

---

## Notes for Ralph

1. **Counters are already tracked** - No need to modify counter logic, just read the values
2. **Badge infrastructure reused** - Use existing `BadgeService.grantBadge()`
3. **Check exact count match** - Only grant badge when count EQUALS threshold, not greater than
4. **Event data structure** - Verify `data.state.counters.actions` exists in ACTIVITY_RECORDED event
5. **Test incrementally** - Test first_push before testing higher milestones
