# GitHub Simulator CLI

A CLI tool to simulate GitHub webhook events for local testing against Firebase emulators.

## Why Use This?

Instead of setting up ngrok tunnels and triggering real GitHub events:

- **Faster testing** - No network round-trips to GitHub
- **No ngrok required** - Works entirely locally
- **Deterministic payloads** - Consistent event data for reliable testing
- **Simulate any event** - Test edge cases that are hard to trigger manually

## Prerequisites

- Node.js 24+
- Firebase emulators running (`nx serve firebase-app`)
- Config file at `.claude/config.local.json`

## Installation & Setup

### 1. Build the CLI

```bash
nx build github-simulator
```

### 2. Create Config File

Create `.claude/config.local.json` in the project root:

```json
{
  "github": {
    "userId": 12345678,
    "username": "your-github-username",
    "email": "your.email@example.com",
    "displayName": "Your Name",
    "nodeId": "MDQ6VXNlcjEyMzQ1Njc4"
  },
  "codeheroes": {
    "userId": "1000000"
  },
  "testRepository": {
    "id": 987654321,
    "name": "your-test-repo",
    "owner": "your-github-username",
    "fullName": "your-github-username/your-test-repo",
    "nodeId": "R_kgDAaBcDeF"
  }
}
```

### 3. Getting Your Config Values

**GitHub User ID & Node ID:**
```bash
# Get your GitHub user info
curl -s https://api.github.com/users/YOUR_USERNAME | jq '{id, node_id, login}'
```

**Repository ID & Node ID:**
```bash
# Get repository info
curl -s https://api.github.com/repos/OWNER/REPO | jq '{id, node_id, name, full_name}'
```

**CodeHeroes User ID:** This is the ID from your seeded user in Firestore (e.g., "1000002").

## Usage

Run commands using nx:

```bash
nx serve github-simulator -- <command> [options]
```

Or after building, run directly:

```bash
node dist/apps/github-simulator/main.cjs <command> [options]
```

### Global Options

| Option | Description |
|--------|-------------|
| `--no-validate` | Skip emulator availability check |
| `-v, --verbose` | Show full request/response details |

## Commands Reference

### Push Events

Simulate code pushes to a branch.

```bash
# Basic push to main
nx serve github-simulator -- push

# Push to feature branch
nx serve github-simulator -- push --branch feature/my-feature

# Push with custom commit message
nx serve github-simulator -- push --message "Add new feature"

# Push multiple commits
nx serve github-simulator -- push --commits 3
```

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--branch` | `-b` | `main` | Branch name |
| `--message` | `-m` | `Update code` | Commit message |
| `--commits` | `-c` | `1` | Number of commits |

### Pull Request Events

Simulate pull request lifecycle events.

```bash
# Open a new PR
nx serve github-simulator -- pr open

# Open PR with details
nx serve github-simulator -- pr open --title "Add feature X" --body "Description here"

# Open a draft PR
nx serve github-simulator -- pr open --draft

# Open PR from specific branch
nx serve github-simulator -- pr open --branch feature/my-feature --base develop

# Close PR without merging
nx serve github-simulator -- pr close --number 42

# Merge a PR
nx serve github-simulator -- pr merge --number 42

# Mark draft PR as ready for review
nx serve github-simulator -- pr ready --number 42
```

**pr open options:**

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--title` | `-t` | Auto-generated | PR title |
| `--body` | `-b` | Auto-generated | PR body |
| `--branch` | | Auto-generated | Source branch |
| `--base` | | `main` | Base branch |
| `--number` | `-n` | Auto-generated | PR number |
| `--draft` | `-d` | `false` | Create as draft |

**pr close/merge/ready options:**

| Option | Short | Description |
|--------|-------|-------------|
| `--number` | `-n` | PR number |

### Issue Events

Simulate issue lifecycle events.

```bash
# Open a new issue
nx serve github-simulator -- issue open

# Open issue with details
nx serve github-simulator -- issue open --title "Bug report" --body "Steps to reproduce..."

# Close an issue
nx serve github-simulator -- issue close --number 15
```

| Option | Short | Description |
|--------|-------|-------------|
| `--title` | `-t` | Issue title |
| `--body` | `-b` | Issue body |
| `--number` | `-n` | Issue number |

### Review Events

Simulate pull request review events.

```bash
# Approve a PR
nx serve github-simulator -- review approve --pr 42

# Request changes on a PR
nx serve github-simulator -- review request-changes --pr 42 --body "Please fix the typo"

# Leave a review comment
nx serve github-simulator -- review comment --pr 42 --body "Looks interesting"
```

| Option | Short | Description |
|--------|-------|-------------|
| `--pr` | `-p` | PR number |
| `--body` | `-b` | Review body |

### Comment Events

Simulate comments on PRs and issues.

```bash
# Comment on a PR
nx serve github-simulator -- comment pr --pr 42 --body "Great work!"

# Comment on an issue
nx serve github-simulator -- comment issue --issue 15 --body "Any updates on this?"
```

**comment pr options:**

| Option | Short | Description |
|--------|-------|-------------|
| `--pr` | `-p` | PR number |
| `--body` | `-b` | Comment body |

**comment issue options:**

| Option | Short | Description |
|--------|-------|-------------|
| `--issue` | `-i` | Issue number |
| `--body` | `-b` | Comment body |

## Event Types Summary

| Command | GitHub Event | Action | XP Impact |
|---------|--------------|--------|-----------|
| `push` | `push` | - | XP for commits |
| `pr open` | `pull_request` | `opened` | XP for PR creation |
| `pr open --draft` | `pull_request` | `opened` (draft) | XP for PR creation |
| `pr close` | `pull_request` | `closed` (not merged) | - |
| `pr merge` | `pull_request` | `closed` (merged) | XP for PR merge |
| `pr ready` | `pull_request` | `ready_for_review` | - |
| `issue open` | `issues` | `opened` | XP for issue |
| `issue close` | `issues` | `closed` | - |
| `review approve` | `pull_request_review` | `submitted` (approved) | XP for review |
| `review request-changes` | `pull_request_review` | `submitted` (changes_requested) | XP for review |
| `review comment` | `pull_request_review` | `submitted` (commented) | XP for review |
| `comment pr` | `issue_comment` | `created` | XP for comment |
| `comment issue` | `issue_comment` | `created` | XP for comment |

## Workflow Examples

### Testing a Complete PR Workflow

```bash
# 1. Start with emulators running
nx serve firebase-app

# 2. Open a draft PR
nx serve github-simulator -- pr open --draft --title "Add authentication"

# 3. Push some commits
nx serve github-simulator -- push --branch feature/auth --commits 2

# 4. Mark ready for review
nx serve github-simulator -- pr ready --number 1

# 5. Add a review comment
nx serve github-simulator -- review comment --pr 1 --body "Initial review"

# 6. Approve and merge
nx serve github-simulator -- review approve --pr 1 --body "LGTM!"
nx serve github-simulator -- pr merge --number 1
```

### Testing XP Progression

```bash
# Rapid-fire events to test XP accumulation
nx serve github-simulator -- push
nx serve github-simulator -- push --commits 5
nx serve github-simulator -- pr open
nx serve github-simulator -- issue open
nx serve github-simulator -- review approve --pr 1

# Check Firestore for updated XP at:
# http://localhost:4000/firestore/data/users/{codeheroes-user-id}/stats/current
```

## Troubleshooting

### "Config file not found"

Ensure `.claude/config.local.json` exists in the project root with all required fields.

### "Emulator not available"

1. Start emulators: `nx serve firebase-app`
2. Or skip validation: `--no-validate` (events will fail, but useful for testing CLI itself)

### "User not found" in game engine

The database needs to be seeded with user mappings:

```bash
FIREBASE_PROJECT_ID=your-project-id nx seed database-seeds
```

This creates the `connectedAccounts` that map GitHub user IDs to CodeHeroes users.

### Verifying Events Were Processed

1. **Firestore UI:** http://localhost:4000/firestore
   - Check `gameActions` collection for created actions
   - Check `users/{id}/activities` for processed events
   - Check `users/{id}/stats/current` for XP updates

2. **Emulator Logs:** Watch the terminal running `nx serve firebase-app` for function logs

3. **Verbose Mode:** Add `-v` to see full response details

## Project Structure

```
apps/github-simulator/
├── src/
│   ├── main.ts              # CLI entry point
│   ├── commands/            # Command implementations
│   │   ├── push.ts
│   │   ├── pr.ts
│   │   ├── issue.ts
│   │   ├── review.ts
│   │   └── comment.ts
│   ├── lib/                 # Core utilities
│   │   ├── config.ts        # Config loading
│   │   ├── validator.ts     # Emulator check
│   │   ├── sender.ts        # HTTP sender
│   │   └── output.ts        # Console formatting
│   └── payloads/            # Payload builders
│       ├── common.ts
│       ├── push.ts
│       ├── pull-request.ts
│       ├── issue.ts
│       ├── review.ts
│       └── comment.ts
├── project.json             # Nx project config
└── README.md
```

## Adding New Event Types

1. Create payload builder in `src/payloads/`
2. Create command in `src/commands/`
3. Register command in `src/main.ts`
4. Update this README

## Additional Documentation

For deeper technical details, see the `docs/` folder:

- **[Architecture](docs/architecture.md)** - Internal codebase structure, patterns, and design decisions
- **[Reference](docs/reference.md)** - Complete command reference with all options and examples
- **[Test Report](docs/test-report-2025-01-24.md)** - Comprehensive test validation (132 tests, 100% pass rate)
