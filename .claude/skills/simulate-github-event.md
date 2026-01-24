# Simulate GitHub Event

Simulates a GitHub webhook event using the github-simulator CLI and sends it to the local Firebase function endpoint.

## Usage

```
/simulate-github-event [event-type] [options]
```

**Arguments:**
- `event-type` (optional): The GitHub event type. Default: `push`
- `options` (optional): Additional CLI options like `--verbose`, `--title`, `--number`, etc.

## Supported Events

| Event Type | Description | CLI Command |
|------------|-------------|-------------|
| `push` | Code push to branch | `nx serve github-simulator -- push` |
| `pr-open` | Open a pull request | `nx serve github-simulator -- pr open` |
| `pr-open-draft` | Open a draft PR | `nx serve github-simulator -- pr open --draft` |
| `pr-close` | Close a PR (not merged) | `nx serve github-simulator -- pr close --number N` |
| `pr-merge` | Merge a PR | `nx serve github-simulator -- pr merge --number N` |
| `pr-ready` | Mark draft PR ready | `nx serve github-simulator -- pr ready --number N` |
| `issue-open` | Open an issue | `nx serve github-simulator -- issue open` |
| `issue-close` | Close an issue | `nx serve github-simulator -- issue close --number N` |
| `review-approve` | Approve a PR | `nx serve github-simulator -- review approve --pr N` |
| `review-request-changes` | Request changes | `nx serve github-simulator -- review request-changes --pr N` |
| `review-comment` | Leave review comment | `nx serve github-simulator -- review comment --pr N` |
| `comment-pr` | Comment on PR | `nx serve github-simulator -- comment pr --pr N` |
| `comment-issue` | Comment on issue | `nx serve github-simulator -- comment issue --issue N` |

## Prerequisites

- Firebase emulators must be running: `nx serve firebase-app`
- Database must be seeded with user data: `FIREBASE_PROJECT_ID=codeheroes-app-test nx seed database-seeds`
- Config file must exist: `.claude/config.local.json`

## Instructions

When this skill is invoked, execute the following steps:

### 1. Check prerequisites

Before running commands, verify the emulators are accessible by checking if `http://localhost:5001` responds:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/ 2>/dev/null || echo "failed"
```

If emulators are not running, instruct the user to start them with `nx serve firebase-app`.

### 2. Map event type to CLI command

Map the requested event type to the appropriate CLI command:

| Event Type Argument | CLI Command |
|--------------------|-------------|
| `push` (default) | `push` |
| `pr-open` | `pr open` |
| `pr-open-draft` | `pr open --draft` |
| `pr-close` | `pr close` |
| `pr-merge` | `pr merge` |
| `pr-ready` | `pr ready` |
| `issue-open` | `issue open` |
| `issue-close` | `issue close` |
| `review-approve` | `review approve` |
| `review-request-changes` | `review request-changes` |
| `review-comment` | `review comment` |
| `comment-pr` | `comment pr` |
| `comment-issue` | `comment issue` |

### 3. Execute the CLI command

Run the command using nx:

```bash
nx serve github-simulator -- <command> [options]
```

Pass through any additional options the user provided (e.g., `--verbose`, `--number`, `--title`, `--body`, etc.).

### 4. Display the output

The CLI provides formatted output including:
- Event type and action
- Generated identifiers (delivery ID, commit SHA, PR number, etc.)
- Response status from the webhook endpoint
- Success/failure message

Display this output to the user.

## CLI Options Reference

### Global Options

| Option | Description |
|--------|-------------|
| `-v, --verbose` | Show full request/response details |
| `--no-validate` | Skip emulator availability check |

### Push Options

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--branch` | `-b` | `main` | Branch name |
| `--message` | `-m` | `Update code` | Commit message |
| `--commits` | `-c` | `1` | Number of commits |

### PR Open Options

| Option | Short | Description |
|--------|-------|-------------|
| `--title` | `-t` | PR title |
| `--body` | | PR body |
| `--branch` | | Source branch |
| `--base` | | Base branch (default: main) |
| `--number` | `-n` | PR number |
| `--draft` | `-d` | Create as draft |

### PR Close/Merge/Ready Options

| Option | Short | Description |
|--------|-------|-------------|
| `--number` | `-n` | PR number (required) |

### Issue Options

| Option | Short | Description |
|--------|-------|-------------|
| `--title` | `-t` | Issue title |
| `--body` | | Issue body |
| `--number` | `-n` | Issue number |

### Review Options

| Option | Short | Description |
|--------|-------|-------------|
| `--pr` | `-p` | PR number (required) |
| `--body` | `-b` | Review body |

### Comment Options

| Option | Short | Description |
|--------|-------|-------------|
| `--pr` | `-p` | PR number (for PR comments) |
| `--issue` | `-i` | Issue number (for issue comments) |
| `--body` | `-b` | Comment body |

## Examples

### Basic Events

```bash
# Simulate a push (default)
nx serve github-simulator -- push

# Open a pull request
nx serve github-simulator -- pr open

# Open a draft PR with custom title
nx serve github-simulator -- pr open --draft --title "Add new feature"

# Merge PR #1
nx serve github-simulator -- pr merge --number 1

# Approve PR #1
nx serve github-simulator -- review approve --pr 1 --body "LGTM!"
```

### Complete PR Workflow

```bash
# 1. Open a draft PR
nx serve github-simulator -- pr open --draft --title "Add authentication"

# 2. Push some commits
nx serve github-simulator -- push --branch feature/auth --commits 2

# 3. Mark ready for review
nx serve github-simulator -- pr ready --number 1

# 4. Approve and merge
nx serve github-simulator -- review approve --pr 1 --body "Looks good!"
nx serve github-simulator -- pr merge --number 1
```

### Verbose Mode

Add `-v` or `--verbose` to see full request/response details:

```bash
nx serve github-simulator -- push --verbose
```

## Configuration

The CLI reads from `.claude/config.local.json`. This file is gitignored to keep personal data out of the repository.

To set up:
1. Copy `.claude/config.example.json` to `.claude/config.local.json`
2. Fill in your GitHub user ID, username, email, and test repository details
3. Ensure your GitHub user ID is mapped in the database seed data

See `apps/github-simulator/README.md` for detailed configuration instructions.

## Verification

After running an event, verify it was processed:

1. **Firestore UI:** http://localhost:4000/firestore
   - Check `gameActions` collection for created actions
   - Check `users/{id}/activities` for processed events
   - Check `users/{id}/stats/current` for XP updates

2. **Emulator Logs:** Watch the terminal running `nx serve firebase-app` for function logs

3. **Verbose Mode:** Add `-v` to see full response details
