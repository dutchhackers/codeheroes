# Test GitHub Events Skill

Use this skill to run a comprehensive test of all GitHub event types using the simulator.

## Prerequisites

1. **Emulators must be running**: `nx serve firebase-app`
2. **Database should be seeded**: `FIREBASE_PROJECT_ID=your-project-id nx seed database-seeds`

## Test Procedure

### Step 1: Clear and Seed Database

```bash
# Clear existing data
curl -X DELETE "http://localhost:8080/emulator/v1/projects/your-project-id/databases/(default)/documents"

# Seed users
FIREBASE_PROJECT_ID=your-project-id nx seed database-seeds
```

### Step 2: Run All Event Simulations

Execute each command in order (some have dependencies):

```bash
# 1. Push event
nx serve github-simulator -- push

# 2. PR lifecycle (PR #100)
nx serve github-simulator -- pr open --number 100
nx serve github-simulator -- review approve --pr 100
nx serve github-simulator -- review comment --pr 100
nx serve github-simulator -- review-comment create --pr 100 --path src/main.ts --line 10
nx serve github-simulator -- comment pr --pr 100
nx serve github-simulator -- pr merge --number 100

# 3. PR close without merge (PR #101)
nx serve github-simulator -- pr open --number 101
nx serve github-simulator -- pr close --number 101

# 4. Issue lifecycle (Issue #50)
nx serve github-simulator -- issue open --number 50
nx serve github-simulator -- comment issue --issue 50
nx serve github-simulator -- issue close --number 50

# 5. Release
nx serve github-simulator -- release publish --tag v1.0.0

# 6. Workflow
nx serve github-simulator -- workflow success

# 7. Discussions (use the number returned from create)
nx serve github-simulator -- discussion create
# Note the discussion number from output, then:
nx serve github-simulator -- discussion comment --discussion <NUMBER>
```

### Step 3: Verify Results

Check emulator logs for:
- `"message":"XP calculation result"` - Shows XP awarded per action
- `"message":"Game action processed successfully"` - Confirms success
- Look for any `"severity":"ERROR"` messages

## Expected Results

| Action Type | Base XP | Possible Bonuses |
|-------------|---------|------------------|
| `code_push` | 120 | +250 (multiple commits) |
| `pull_request_create` | 100 | +100 (multiple files), +200 (significant changes) |
| `pull_request_merge` | 100 | +100 (multiple files), +200 (significant changes) |
| `pull_request_close` | 50 | +50 (multiple files), +100 (significant changes) |
| `code_review_submit` | 80 | +50 (approval), +100 (detailed), +50 (multiple files), +150 (thorough) |
| `review_comment_create` | 40 | +30 (with suggestion), +20 (detailed) |
| `comment_create` | 30 | +20 (detailed) |
| `issue_create` | 80 | +70 (detailed description), +30 (with labels) |
| `issue_close` | 60 | +50 (referenced in PR) |
| `release_publish` | 200 | +150 (major), +50 (minor), +30 (with notes) |
| `ci_success` | 30 | +50 (deployment) |
| `discussion_create` | 60 | +40 (detailed) |
| `discussion_comment` | 30 | +70 (accepted answer) |

## Full Event List (16 total)

| # | Game Action Type | Simulator Command |
|---|------------------|-------------------|
| 1 | `code_push` | `push` |
| 2 | `pull_request_create` | `pr open --number N` |
| 3 | `pull_request_merge` | `pr merge --number N` |
| 4 | `pull_request_close` | `pr close --number N` |
| 5 | `code_review_submit` (approve) | `review approve --pr N` |
| 6 | `code_review_submit` (comment) | `review comment --pr N` |
| 7 | `review_comment_create` | `review-comment create --pr N --path FILE --line N` |
| 8 | `comment_create` (PR) | `comment pr --pr N` |
| 9 | `comment_create` (issue) | `comment issue --issue N` |
| 10 | `issue_create` | `issue open --number N` |
| 11 | `issue_close` | `issue close --number N` |
| 12 | `release_publish` | `release publish --tag vX.X.X` |
| 13 | `ci_success` | `workflow success` |
| 14 | `discussion_create` | `discussion create` |
| 15 | `discussion_comment` | `discussion comment --discussion N` |

## Troubleshooting

### First event fails with counter error
This was a known bug (now fixed). If you see "Cannot read properties of undefined (reading 'code_push')", restart emulators after the fix is deployed.

### User not found
Ensure database is seeded. The webhook maps GitHub ID 7045335 to CodeHeroes user 1000002.

### Events not processing
Check that emulators are running. Watch the emulator terminal for processing logs.

### gameActions show as "failed"
Check the `error` field in the Firestore Emulator UI at http://localhost:4000/firestore/default/data/gameActions
