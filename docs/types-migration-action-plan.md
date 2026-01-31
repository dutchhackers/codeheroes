# Types Library Migration - Action Plan

**Goal:** Make `@libs/types` the single source of truth for all shared types, enabling `apps/activity-wall` and other apps to reliably consume types from a central location.

**Status:** ✅ Analysis Complete - Ready to Execute

---

## Quick Summary

### What's Working ✅
- `@libs/types` is well-structured and production-ready
- `apps/activity-wall` successfully uses it (17 files, zero local duplicates)
- Server libs (`progression-engine`, `integrations`, etc.) use it extensively
- TypeScript path alias `@codeheroes/types` configured correctly

### What Needs Fixing ❌
- `apps/web` has duplicate interface definitions (IActivity, IUser, IUserStats)
- Some useful types are commented out in index.ts
- Minor naming inconsistencies (photoUrl vs photoURL)

### Impact
- **Low Risk:** Types library is solid, just needs adoption
- **Medium Effort:** 26 import statements to update in apps/web
- **High Value:** Single source of truth, better maintainability

---

## Execution Plan

### ✅ PHASE 1: Verify & Document (Complete)

- [x] Analyze current type structure
- [x] Identify duplicates and gaps
- [x] Document findings
- [x] Create migration plan

### 🔧 PHASE 2: Prepare Types Library (1-2 hours)

#### Task 2.1: Enable Already-Implemented Types (15 min)

**File:** `libs/types/src/lib/index.ts`

**Action:** Uncomment these exports (files exist and are used):
```typescript
export * from './activity/context.types';  // Used by activity/activity.types.ts
// Note: metrics.types and events.types are empty - leave commented
```

**Verification:**
```bash
nx run types:build
# Should succeed
```

#### Task 2.2: Add Extended UserStats (30 min)

**Problem:** apps/web needs branches, issues, tags stats that aren't in current UserStats

**Option A (Recommended):** Extend existing UserStats
```typescript
// libs/types/src/lib/user/stats.types.ts
// Add to existing interface:
export interface UserStats {
  // ... existing fields ...
  
  // Extended metrics (optional - for apps that track these)
  branches?: {
    active: number;
    deleted: number;
    total: number;
  };
  issues?: {
    closed: number;
    reopened: number;
    total: number;
  };
  tags?: {
    deleted: number;
    total: number;
  };
}
```

**Option B (Alternative):** Create separate ExtendedUserStats
```typescript
// libs/types/src/lib/user/extended-stats.types.ts
export interface ExtendedUserStats extends UserStats {
  branches: { ... };
  issues: { ... };
  tags: { ... };
}
```

**Recommendation:** Option A - makes fields optional so existing code continues to work

#### Task 2.3: Verify UserProfileDto (5 min)

**Action:** Confirm UserProfileDto has all fields apps/web needs
```typescript
// libs/types/src/lib/user/user.types.ts
export interface UserProfileDto extends UserDto {
  level: number;
  xp: number;
  // Add if missing:
  currentLevelXp?: number;
  xpToNextLevel?: number;
}
```

#### Task 2.4: Build & Test Types Library (10 min)

```bash
# Build types library
nx build types

# Verify no errors
nx run types:lint
```

### 🚀 PHASE 3: Migrate apps/web (4-6 hours)

#### Task 3.1: Audit Current Usage (30 min)

```bash
# Find all usages of local types
cd /home/runner/work/codeheroes/codeheroes
grep -r "from.*interfaces/activity.interface" apps/web/src --include="*.ts" > /tmp/activity-imports.txt
grep -r "from.*interfaces/user.interface" apps/web/src --include="*.ts" > /tmp/user-imports.txt
grep -r "IActivity\|IUser\|IUserStats" apps/web/src --include="*.ts" > /tmp/all-usages.txt

# Review the files
cat /tmp/all-usages.txt
```

#### Task 3.2: Create Migration Branch (5 min)

```bash
git checkout -b feature/migrate-web-to-shared-types
```

#### Task 3.3: Update Core Services First (1 hour)

**Priority:** API service layer (data fetch/transform)

**Files to update:**
1. `apps/web/src/app/core/services/api.service.ts`
2. `apps/web/src/app/core/services/user.service.ts`
3. `apps/web/src/app/core/services/activity.service.ts`

**Changes:**
```typescript
// Before:
import { IUser, IActivity } from '@/core/interfaces';

// After:
import { UserProfileDto, Activity } from '@codeheroes/types';

// Optional: Type aliases for convenience
type User = UserProfileDto;
```

**Note:** If Activity union type doesn't match IActivity structure:
- Check if apps/web actually receives discriminated union from backend
- Add adapter if needed: `function adaptActivity(raw: any): Activity { ... }`
- Consider updating backend to return correct format

#### Task 3.4: Update Components (2-3 hours)

**Strategy:** Update one feature module at a time

**Order:**
1. User-related components (profile, user list)
2. Activity feed components
3. Other components

**For each component:**
```typescript
// 1. Update imports
import { UserProfileDto, Activity } from '@codeheroes/types';

// 2. Update type annotations
// Before: user: IUser
// After: user: UserProfileDto

// 3. Fix any property access issues
// If properties changed, update template and logic
```

**Common patterns:**
```typescript
// Template binding (Angular)
// Before: {{ user.xp }}
// After: {{ user.xp }} // Same - no change needed

// Type guards
// Before: if (activity.type === 'CODE_PUSH')
// After: if (activity.type === 'game-action' && activity.sourceActionType === 'code_push')
```

#### Task 3.5: Update Tests (1 hour)

**Files:** `*.spec.ts` files that mock IUser or IActivity

**Changes:**
```typescript
// Before:
const mockUser: IUser = { ... };

// After:
import { UserProfileDto } from '@codeheroes/types';
const mockUser: UserProfileDto = { ... };
```

#### Task 3.6: Remove Local Type Files (15 min)

**Only after all references are removed!**

```bash
# Verify no references remain
grep -r "from.*interfaces/activity.interface" apps/web/src --include="*.ts"
grep -r "from.*interfaces/user.interface" apps/web/src --include="*.ts"

# If empty, remove files
git rm apps/web/src/app/core/interfaces/activity.interface.ts
git rm apps/web/src/app/core/interfaces/user.interface.ts
git rm apps/web/src/app/core/interfaces/day-activity.interface.ts
git rm apps/web/src/app/core/types/activity-type.type.ts

# Keep if truly app-specific:
# - event-type.type.ts (GitHub events)
# - activity-data-type.type.ts (activity data variants)
```

#### Task 3.7: Update Barrel Exports (10 min)

```bash
# If apps/web has barrel exports (index.ts files)
# Remove references to deleted types
```

### ✅ PHASE 4: Validation (2-3 hours)

#### Task 4.1: TypeScript Compilation (10 min)

```bash
# Type check only
nx run web:type-check
# Or
cd apps/web && npx tsc --noEmit

# Should pass with no errors
```

#### Task 4.2: Build Test (15 min)

```bash
# Full build
nx build web --configuration=production

# Should succeed
```

#### Task 4.3: Lint (10 min)

```bash
nx run web:lint --fix
```

#### Task 4.4: Unit Tests (30 min)

```bash
nx test web
# Fix any broken tests
```

#### Task 4.5: Manual Testing (1-2 hours)

**Test Scenarios:**

1. **User Profile Page**
   - [ ] Profile loads correctly
   - [ ] XP/Level displayed correctly
   - [ ] Stats display correctly (if using extended stats)
   - [ ] Photo loads correctly

2. **Activity Feed**
   - [ ] Activities display correctly
   - [ ] Activity types render properly
   - [ ] XP values shown correctly
   - [ ] Activity details expand/collapse

3. **User List/Search**
   - [ ] Users load and display
   - [ ] Sorting works
   - [ ] Filtering works

4. **Forms (if any)**
   - [ ] User profile update works
   - [ ] Data saves correctly

**How to Test:**
```bash
# Start dev server
nx serve web

# Or test environment
nx serve web --configuration=test

# Navigate to http://localhost:4200
# Test each scenario
```

#### Task 4.6: Cross-App Consistency Check (30 min)

**Compare apps/web with apps/activity-wall:**

```bash
# Start both apps
nx serve web &
nx serve activity-wall &

# Compare data display
# - Open same user profile in both apps
# - Check activity feed in both
# - Verify data looks consistent
```

### 📝 PHASE 5: Documentation (1 hour)

#### Task 5.1: Create Types Library README (30 min)

**File:** `libs/types/README.md`

```markdown
# @codeheroes/types

Shared TypeScript type definitions for the Code Heroes platform.

## Purpose

This library provides type definitions shared across:
- Backend services (Cloud Functions)
- Frontend apps (web, activity-wall)
- Shared libraries

## Usage

```typescript
import { Activity, UserDto, GameActionType } from '@codeheroes/types';
```

## Guidelines

1. **All shared types go here** - Don't duplicate types across apps
2. **Use discriminated unions** for polymorphic types (see Activity)
3. **Keep types pure** - No logic, only type definitions
4. **Export through index.ts** - Maintain clean API surface
5. **Document complex types** - Add JSDoc comments

## Type Organization

- `core/` - Base types (BaseDocument, Providers)
- `user/` - User types (UserDto, UserStats, UserProfileDto)
- `activity/` - Activity types (Activity union, ActivityType)
- `game/` - Game mechanics (GameAction, ActionResult, Context, Metrics)
- `gamification/` - Badges, Levels, Achievements, Progression
- `collections/` - Firestore collection names
- `notifications/` - Notification types
- `utils/` - Utility types (Pagination, TimeFrame)

## Key Types

### Activity (Discriminated Union)

```typescript
type Activity = GameActionActivity | BadgeEarnedActivity | LevelUpActivity;

// Use type guards:
if (isGameActionActivity(activity)) {
  // activity.sourceActionType, activity.xp, etc.
}
```

### User Types

- `UserDto` - Basic user info
- `UserProfileDto` - User with level/xp (extends UserDto)
- `UserStats` - User statistics

### Game Actions

- `GameAction` - Action to be processed
- `GameActionType` - Action type enum
- `GameActionContext` - Action context (repo, PR, etc.)
- `GameActionMetrics` - Action metrics (LOC, commits, etc.)

## Building

```bash
nx build types
```

## Adding New Types

1. Create file in appropriate directory: `libs/types/src/lib/<category>/<name>.types.ts`
2. Export from index: `export * from './lib/<category>/<name>.types';`
3. Build and verify: `nx build types`
4. Use in your app: `import { MyType } from '@codeheroes/types';`
```

#### Task 5.2: Update Architecture Docs (20 min)

**File:** `docs/architecture/overview.md`

Add section on type system:
```markdown
## Type System

Code Heroes uses a centralized type library (`@libs/types`) for all shared types.

### Principles

1. **Single Source of Truth** - All shared types defined once
2. **Frontend & Backend** - Types used by both
3. **Type Safety** - Leverage TypeScript discriminated unions

### Import Pattern

```typescript
import { Activity, UserDto, GameActionType } from '@codeheroes/types';
```

See `libs/types/README.md` for details.
```

#### Task 5.3: Update CLAUDE.md (10 min)

Add to `.claude/CLAUDE.md` (custom instructions):
```markdown
## Type System

- All shared types are in `@libs/types` (`libs/types/`)
- Import via: `import { Type } from '@codeheroes/types';`
- Do NOT create duplicate type definitions
- For app-specific types, create in app's local types folder
- See `libs/types/README.md` for guidelines
```

### 🎉 PHASE 6: Merge & Deploy (30 min)

#### Task 6.1: Final Review (10 min)

```bash
# Check what's changed
git status
git diff --stat

# Review commits
git log --oneline origin/main..HEAD
```

#### Task 6.2: Create Pull Request (10 min)

```bash
git push origin feature/migrate-web-to-shared-types
```

**PR Description Template:**
```markdown
## Migrate apps/web to @codeheroes/types

### Changes

- ✅ Removed duplicate type definitions (IActivity, IUser, IUserStats)
- ✅ Updated all imports to use @codeheroes/types
- ✅ Extended UserStats with optional branch/issue/tag fields
- ✅ Verified UserProfileDto has all needed fields
- ✅ Updated tests to use shared types

### Testing

- [x] TypeScript compilation passes
- [x] Build succeeds
- [x] Unit tests pass
- [x] Manual testing completed
- [x] Cross-app consistency verified

### Impact

- **Breaking Changes:** None (internal refactor)
- **New Features:** None
- **Bug Fixes:** None
- **Improvements:** Better type consistency, easier maintenance

### Files Changed

- Removed: 4 local type definition files
- Updated: ~30 files to import from @codeheroes/types
- Modified: libs/types to add extended stats fields
```

#### Task 6.3: Code Review & Merge (10 min)

- Get PR reviewed
- Address feedback
- Merge to main

---

## Rollback Plan

If issues arise in production:

### Quick Rollback
```bash
git revert <merge-commit-sha>
git push origin main
```

### Gradual Rollback
1. Keep migration branch available
2. Revert specific files if only some are problematic
3. Fix issues and redeploy

---

## Success Metrics

- [ ] Zero duplicate type definitions across codebase
- [ ] All apps import types from @codeheroes/types
- [ ] TypeScript strict mode passes
- [ ] All builds succeed
- [ ] All tests pass
- [ ] No runtime errors in production
- [ ] Documentation updated

---

## Time Estimate

| Phase | Time | Total |
|-------|------|-------|
| Phase 1: Analysis | ✅ Done | 0h |
| Phase 2: Prepare Types Lib | 1-2h | 1-2h |
| Phase 3: Migrate apps/web | 4-6h | 5-8h |
| Phase 4: Validation | 2-3h | 7-11h |
| Phase 5: Documentation | 1h | 8-12h |
| Phase 6: Merge & Deploy | 0.5h | 8.5-12.5h |

**Total:** 8-13 hours of focused work

**Spread over:** 2-3 days with reviews and testing

---

## Next Immediate Steps

### Today (30 minutes):

1. **Review this plan** - Make sure team agrees with approach
2. **Check UserStats** - Verify if extended stats are actually needed
3. **Create feature branch** - Start fresh
4. **Run Phase 2 Task 2.1** - Enable context.types export

### Tomorrow (4-6 hours):

1. **Run Phase 2 Tasks 2.2-2.4** - Extend UserStats, build types lib
2. **Run Phase 3 Tasks 3.1-3.4** - Audit usage, update services & components

### Day 3 (4-6 hours):

1. **Run Phase 3 Tasks 3.5-3.7** - Update tests, remove old files
2. **Run Phase 4** - Full validation and testing
3. **Run Phase 5** - Documentation
4. **Run Phase 6** - Create PR and merge

---

## Questions to Answer Before Starting

1. **Does apps/web actually need branches/issues/tags stats?**
   - Check if these are displayed anywhere
   - If not, no need to add to UserStats

2. **Is Activity union type compatible with apps/web data?**
   - Test with actual API response
   - May need adapter function

3. **Are there any other local types in apps/web we haven't found?**
   - Do a final sweep
   - Check for interface definitions in components

4. **Who will review the PR?**
   - Assign reviewer
   - Schedule review time

---

## Contact & Support

If you encounter issues during migration:

1. **TypeScript errors:** Check import paths, verify types exist
2. **Runtime errors:** Check for property name changes (photoUrl vs photoURL)
3. **Test failures:** Update mock data to match new type structure
4. **Build failures:** Clear nx cache: `nx reset`, then rebuild

**Questions?** See `libs/types/README.md` or ask in team chat.

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-31  
**Status:** Ready to Execute
