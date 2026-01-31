# Level System Fixes (Level 20+ Boundary Issues)

> **Created:** 2025-01-31
> **Status:** ✅ COMPLETED (2026-01-31)
> **Source:** PR #224 Copilot review comments

## Summary

The hybrid level system had issues at the Level 20 → 21 transition where static thresholds meet algorithmic calculation. These were identified during PR review and have now been fixed.

## Resolution

All issues have been resolved in PR #224:

1. **Non-monotonic XP Curve** → Fixed by using offset formula: `LEVEL_20_XP + 1500 × (level - 20)²`
2. **Level Skipping** → Fixed `getLevelFromXp()` to use inverse of new formula
3. **Missing Algorithmic Badges** → Added all algorithmic level badges to `badge-catalog.config.ts`
4. **reward.id Issue** → Fixed by passing `metadata.badgeId` in `MilestoneRewardService`

---

## Historical Context (Original Issues)

## Issues

### Issue 1: Non-monotonic XP Curve

**File:** `libs/server/progression-engine/src/lib/config/level-definitions.config.ts:189`

**Problem:** Level 20 requires **775,000 XP** (static), but the algorithmic formula for Level 21 calculates to only **661,500 XP** (`1500 × 21² = 661,500`). This means Level 21 requires *less* XP than Level 20, breaking the progression curve.

**Impact:** Confusing UX where higher levels require less XP.

### Issue 2: `getLevelFromXp()` Can Skip Levels

**File:** `libs/server/progression-engine/src/lib/config/level-thresholds.ts:71`

**Problem:** When XP exceeds Level 20's threshold (775,000), the function switches to algorithmic calculation. Since algorithmic thresholds for 21/22 are below 775,000, users can incorrectly "jump" to level 22+ directly, skipping intermediate levels.

**Impact:** Users may never see levels 21-22, jumping straight to 23+.

### Issue 3: Algorithmic Level Badges Not in Catalog

**File:** `libs/server/progression-engine/src/lib/config/level-thresholds.ts:119`

**Problem:** `getLevelRequirements()` returns badge IDs like `code_mentor`, `code_virtuoso` for levels 21+, but these don't exist in `BADGE_CATALOG`. The `BadgeService.grantBadge()` will silently fail (returns null) for non-existent badges.

**Impact:** Users past level 20 won't receive level badges.

### Issue 4: `reward.id` in RewardService (Needs Investigation)

**File:** `libs/server/progression-engine/src/lib/rewards/services/reward.service.ts:76`

**Problem:** The code passes `reward.id` to `BadgeService.grantBadge()`. If reward IDs are generated like `level_5_reward_xyz_timestamp`, they won't match catalog badge IDs.

**Investigation needed:** Confirm whether rewards are created with catalog-matching IDs or if a dedicated `badgeId` field is needed in `reward.metadata`.

## Recommended Fixes

### Option A: Adjust Level 20 Threshold (Minimal Change)

Lower Level 20's XP threshold to be below the algorithmic Level 21 threshold:
- Current Level 20: 775,000 XP
- Algorithmic Level 21: 661,500 XP (`1500 × 21²`)
- **New Level 20:** ~600,000 XP (ensures monotonic progression)

```typescript
// level-definitions.config.ts
{ level: 20, xpRequired: 600000, ... }
```

### Option B: Adjust Algorithmic Formula (Better Long-term)

Modify the algorithmic formula to start from Level 20's endpoint:

```typescript
// Use offset to ensure algorithmic levels start above Level 20
const LEVEL_20_XP = 775000;
const ALGORITHMIC_BASE = 1500;

function calculateXpForLevel(level: number): number {
  if (level <= MAX_STATIC_LEVEL) {
    return LEVEL_DEFINITIONS[level - 1].xpRequired;
  }
  // Start algorithmic levels from Level 20's XP
  const levelsAbove20 = level - MAX_STATIC_LEVEL;
  return LEVEL_20_XP + (ALGORITHMIC_BASE * levelsAbove20 * levelsAbove20);
}
```

### Option C: Add Algorithmic Level Badges

Add badge definitions for levels 21-80 (or however high you want to support):

```typescript
// badge-catalog.config.ts
code_mentor: {
  id: 'code_mentor',
  name: 'Code Mentor',
  description: 'Reached level 21',
  icon: '🎓',
  rarity: BadgeRarity.LEGENDARY,
  category: 'level',
  metadata: { level: 21 },
},
// ... etc for levels 22-80
```

**Or** return empty badges array for algorithmic levels:

```typescript
// level-thresholds.ts
if (level > MAX_STATIC_LEVEL) {
  return {
    // ...
    badges: [], // No badges for algorithmic levels
  };
}
```

## Files to Modify

| File | Change |
|------|--------|
| `libs/server/progression-engine/src/lib/config/level-definitions.config.ts` | Adjust Level 20 XP threshold |
| `libs/server/progression-engine/src/lib/config/level-thresholds.ts` | Fix `getLevelFromXp()` and `calculateXpForLevel()` |
| `libs/server/progression-engine/src/lib/config/badge-catalog.config.ts` | Add algorithmic level badges OR |
| `libs/server/progression-engine/src/lib/config/level-thresholds.ts` | Return empty badges for levels 21+ |
| `libs/server/progression-engine/src/lib/rewards/services/reward.service.ts` | Investigate reward.id usage |

## Verification

After fixing:

1. Test level calculations:
   ```typescript
   // Verify monotonic progression
   for (let xp = 0; xp < 1000000; xp += 50000) {
     const level = getLevelFromXp(xp);
     console.log(`XP: ${xp} → Level: ${level}`);
   }
   ```

2. Test no level skipping:
   ```typescript
   // Verify levels increment by 1
   let prevLevel = 0;
   for (let xp = 0; xp < 1000000; xp += 1000) {
     const level = getLevelFromXp(xp);
     if (level !== prevLevel) {
       console.assert(level === prevLevel + 1, `Skipped from ${prevLevel} to ${level}`);
       prevLevel = level;
     }
   }
   ```

3. Simulate level-up past 20 and verify badges are granted (or correctly not granted).
