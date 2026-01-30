# CodeHeroes Progression System Analysis

**Date:** January 30, 2026
**Scope:** Progression Engine, Leveling Logic, XP Calculation, and State Management.

---

## 1. System Architecture

The progression system operates as an asynchronous, event-driven engine designed to convert **Game Actions** (derived from external providers like GitHub) into persistent **User State** (XP, Levels, Badges).

### Data Flow Pipeline

1.  **Ingestion**: A `GameAction` document is created in Firestore (`gameActions/{id}`).
2.  **Trigger**: The `processGameAction` Cloud Function detects the new document and initializes the `ProgressionService`.
3.  **Calculation**: The `XpCalculatorService` determines the total XP (Base + Bonuses) using specific `ActionHandlers` based on the action type.
4.  **Persistence**: The `ProgressionRepository` executes a Firestore Transaction to atomically:
    *   Create an immutable `Activity` record.
    *   Update the mutable `ProgressionState` (User stats).
    *   Update time-series records (`Daily` and `Weekly` stats).
5.  **Side Effects**: Events (`progression.xp.gained`, `progression.level.up`) are published via Pub/Sub to trigger decoupled systems like Notifications and Achievements.

---

## 2. Current Implementation Details

### A. Leveling Mechanics
*   **Location**: `libs/server/progression-engine/src/lib/config/`
*   **Method**: Static Threshold Lookup Table.
*   **Definition**: `level-definitions.config.ts`.

The system does **not** use a mathematical formula. It relies on a manually defined array of levels.

*   **Max Level**: Hard-capped at **Level 20** (1,250,000 XP).
*   **Progression Curve**: Non-linear / Hand-tuned.
    *   *Early Game*: Level 1-2 gap is 1,000 XP.
    *   *End Game*: Level 19-20 gap is 250,000 XP.
*   **Logic**: `level-thresholds.ts` iterates through the configuration array to match current XP to a level definition.

### B. XP Calculation Logic
*   **Location**: `libs/server/progression-engine/src/lib/progression/handlers/actions/`
*   **Pattern**: Strategy Pattern via `ActionHandlerFactory`.

| Action Type | Base XP | Notable Bonuses | Handler File |
| :--- | :--- | :--- | :--- |
| **Code Push** | 120 | +250 (Multiple Commits)<br>+100 (New Branch) | `code-push.handler.ts` |
| **PR Create** | 100 | +100 (Multi-file)<br>+200 (Significant changes) | `pull-request.handler.ts` |
| **PR Merge** | 100 | *Same as create* | `pull-request.handler.ts` |
| **Review** | 80 | +50 (Approved)<br>+150 (Thorough/Suggestions) | `code-review.handler.ts` |
| **Review Comment** | 40 | +30 (Has `suggestion` block)<br>+20 (Detailed body) | `review-comment.handler.ts` |
| **Issue Create** | 80 | +70 (Detailed description)<br>+30 (Has labels) | `issue.handler.ts` |
| **Release** | 200 | +150 (Major version)<br>+50 (Minor version) | `release.handler.ts` |

### C. State Management
*   **Location**: `libs/server/progression-engine/src/lib/progression/repositories/progression.repository.ts`

1.  **Lazy Initialization**: If `users/{id}/stats/current` does not exist, it is created on-the-fly during the first action processing (Level 1, 0 XP).
2.  **Concurrency Control**: Uses `db.runTransaction` to generate a "Transaction Plan" before execution, ensuring XP integrity during simultaneous webhooks.
3.  **Counters**: Maintains a map of `counters.actions` (e.g., `counters.actions.code_push: 12`) within the stats document for O(1) access to activity counts.

---

## 3. Bug Hunting & Risk Analysis

### 🔴 Critical: Level Skipping Misses Rewards
**Location**: `libs/server/progression-engine/src/lib/progression/services/milestone-reward.service.ts`

**The Logic:**
```typescript
private async handleLevelUpRewards(userId: string, newLevel: number): Promise<void> {
    const previousLevel = newLevel - 1; // <--- FLAWED ASSUMPTION
    const levelRequirements = this.levelService.getNextLevelRequirements(previousLevel);
    // ... grants rewards for "newLevel" only
}
```

**The Issue:**
If a user gains enough XP in a single transaction (e.g., a Release event with bonuses) to jump from **Level 1 to Level 3**, the system calculates `previousLevel` as 2. It grants Level 3 rewards but **completely skips** Level 2 rewards.

**Fix**: Refactor logic to iterate from `oldState.level + 1` up to `newState.level` and process rewards for every intermediate level.

### 🟡 Warning: Hard Level Cap Behavior
**Location**: `libs/server/progression-engine/src/lib/config/level-thresholds.ts`

**The Issue:**
The `getXpProgress` function returns `xpToNextLevel: 0` when the user reaches the max defined level (20).
*   **Risk**: Frontend components (like `user-xp-progress-bar`) performing `currentXP / xpToNextLevel` will encounter a **Divide By Zero** error or render NaN/Infinity.
*   **Gameplay Impact**: Users at Level 20 stop receiving "Level Up" events indefinitely, even if they continue to accrue XP.

### 🟡 Warning: Counter Initialization Maintenance
**Location**: `progression.repository.ts` -> `getInitialCounters`

**The Issue:**
Counters are explicitly hardcoded. If a new `GameActionType` is added to the system types but omitted from `getInitialCounters`, the counter logic will rely on fallback behavior. While the current code handles `undefined` via `|| 0` checks, it leads to inconsistent data schemas in Firestore between old and new users.

---

## 4. Suggestions for Improvement

### A. Algorithmic Leveling (Infinite Progression)
Switch from a static array to a mathematical curve. This removes the maintenance burden of defining new levels and solves the "Hard Cap" bug.

**Proposal**:
```typescript
// level.utils.ts
const CONSTANT = 0.15; // Tuning parameter

// Calculate Level based on Total XP
export function calculateLevelFromXp(xp: number): number {
  return Math.floor(CONSTANT * Math.sqrt(xp)) + 1;
}

// Calculate XP needed to reach a specific Level
export function calculateXpForLevel(level: number): number {
  return Math.pow((level - 1) / CONSTANT, 2);
}
```

### B. Implement "Streaks" Logic
The types exist (`libs/types`), but the engine logic is missing.

**Implementation Plan**:
1.  **Repository**: Inside `updateState`, compare `currentDate` vs `lastActivityDate`.
    *   *Yesterday*: Increment streak.
    *   *Today*: No change.
    *   *Older*: Reset streak to 1.
2.  **XP Bonus**: Inject a `StreakMultiplier` into the `XpCalculatorService` (e.g., 1.05x XP for every day of streak, capped at 1.5x).

### C. Refactor Rewards Architecture
Decouple rewards from the `LevelDefinition` config. Move them to a dedicated `UnlockRegistry`.

*   **Why**: Currently, rewards are strictly tied to Level Ups.
*   **Benefit**: Enables "Achievement-based" unlocks (e.g., "Review 100 PRs" unlocks a specific badge or title) independent of the user's numeric level.

### D. Enhance Code Review Metrics via API
**Location**: `code-review.handler.ts`

Standard GitHub webhooks for reviews often lack depth (e.g., actual line count reviewed).
*   **Improvement**: Modify the `github-receiver` or `game-engine` to fetch specific review details from the GitHub API when a review event occurs. This ensures `thoroughness` bonuses are based on actual data, preventing users from gaming the system with empty "LGTM" reviews.

### E. Defensive Coding in XP Calculator
**Location**: `xp-calculator.service.ts`

If a specific `ActionHandler` throws an error (e.g., missing metric property), the entire transaction fails.

**Suggestion**: Wrap bonus calculations in a `try/catch` block.
```typescript
try {
  bonuses = handler.calculateBonuses(action.context, action.metrics);
} catch (e) {
  logger.error('Bonus calculation failed, awarding base XP only', e);
  bonuses = { totalBonus: 0, breakdown: {} };
}
```
This ensures the user always receives at least the Base XP for their action.
