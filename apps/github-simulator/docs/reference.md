# GitHub Simulator - Quick Reference Guide

**Tool:** CLI for simulating GitHub webhook events for local testing
**Version:** 1.0.0
**Status:** Production-ready (132/132 tests passed, 100% success rate)

---

## Basic Usage

```bash
# General syntax
node dist/apps/github-simulator/main.cjs <command> [options]

# With nx
nx serve github-simulator -- <command> [options]
```

### Global Options

| Flag | Description |
|------|-------------|
| `--help, -h` | Show help |
| `--version, -v` | Show version |
| `--no-validate` | Skip emulator availability check |
| `--verbose` | Show detailed request/response output |

---

## Commands

### Push Events

**Simulate a push event**

```bash
gh-sim push [options]
```

**Options:**
- `-b, --branch <name>` - Branch name (default: `main`)
- `-m, --message <msg>` - Commit message (default: `"Update code"`)
- `-c, --commits <count>` - Number of commits (default: `1`)

**Examples:**
```bash
# Simple push
gh-sim push

# Custom branch with message
gh-sim push -b develop -m "Fix bug"

# Multiple commits
gh-sim push -c 5

# All options combined
gh-sim push -b feature/JIRA-123 -m "Major refactor" -c 3

# Feature branch
gh-sim push --branch feature/new-api -m "Add user endpoints" -c 2
```

---

### Pull Request Events

**Manage pull request lifecycle**

```bash
gh-sim pr <subcommand> [options]
```

#### Open a Pull Request

```bash
gh-sim pr open [options]
```

**Options:**
- `-t, --title <title>` - PR title
- `-b, --body <body>` - PR body/description
- `--branch <name>` - Source branch name
- `--base <name>` - Base branch name (default: `main`)
- `-n, --number <num>` - PR number
- `-d, --draft` - Create as draft PR

**Examples:**
```bash
# Simple PR
gh-sim pr open

# With title and body
gh-sim pr open -t "Add new feature" -b "This adds user authentication"

# Draft PR
gh-sim pr open -n 42 -d -t "WIP: New dashboard"

# Feature branch to develop
gh-sim pr open --branch feature/x --base develop -t "Feature X"

# All options
gh-sim pr open -n 10 -t "Title" -b "Description" --branch feat/x
```

#### Close a Pull Request

```bash
gh-sim pr close [options]
```

**Options:**
- `-n, --number <num>` - PR number

**Examples:**
```bash
gh-sim pr close
gh-sim pr close -n 15
```

#### Merge a Pull Request

```bash
gh-sim pr merge [options]
```

**Options:**
- `-n, --number <num>` - PR number

**Examples:**
```bash
gh-sim pr merge
gh-sim pr merge -n 10
```

#### Mark Draft as Ready

```bash
gh-sim pr ready [options]
```

**Options:**
- `-n, --number <num>` - PR number

**Examples:**
```bash
gh-sim pr ready
gh-sim pr ready -n 5
```

---

### Issue Events

**Manage issues**

```bash
gh-sim issue <subcommand> [options]
```

#### Open an Issue

```bash
gh-sim issue open [options]
```

**Options:**
- `-t, --title <title>` - Issue title
- `-b, --body <body>` - Issue body
- `-n, --number <num>` - Issue number

**Examples:**
```bash
# Simple issue
gh-sim issue open

# Bug report
gh-sim issue open -t "Bug: Connection timeout" -b "Steps to reproduce..."

# With number
gh-sim issue open -n 123 -t "Feature request" -b "Add dark mode"
```

#### Close an Issue

```bash
gh-sim issue close [options]
```

**Options:**
- `-n, --number <num>` - Issue number

**Examples:**
```bash
gh-sim issue close
gh-sim issue close -n 15
```

---

### Review Events

**Submit pull request reviews**

```bash
gh-sim review <subcommand> [options]
```

#### Approve a PR

```bash
gh-sim review approve [options]
```

**Options:**
- `-p, --pr <num>` - PR number
- `-b, --body <body>` - Review body

**Examples:**
```bash
gh-sim review approve
gh-sim review approve -p 10
gh-sim review approve -p 10 -b "Looks good to me!"
```

#### Request Changes

```bash
gh-sim review request-changes [options]
```

**Options:**
- `-p, --pr <num>` - PR number
- `-b, --body <body>` - Review body

**Examples:**
```bash
gh-sim review request-changes
gh-sim review request-changes -p 5 -b "Please refactor this function"
gh-sim review request-changes -p 3 -b "Need tests for this feature"
```

#### Comment on Review

```bash
gh-sim review comment [options]
```

**Options:**
- `-p, --pr <num>` - PR number
- `-b, --body <body>` - Review body

**Examples:**
```bash
gh-sim review comment -p 10
gh-sim review comment -p 10 -b "Nice implementation!"
```

---

### Comment Events

**Add comments to PRs and issues**

```bash
gh-sim comment <subcommand> [options]
```

#### Comment on PR

```bash
gh-sim comment pr [options]
```

**Options:**
- `-p, --pr <num>` - PR number
- `-b, --body <body>` - Comment body

**Examples:**
```bash
# Simple comment
gh-sim comment pr

# With PR number
gh-sim comment pr -p 10

# With message
gh-sim comment pr -p 10 -b "This looks good!"

# With formatting
gh-sim comment pr -p 5 -b "Nice work! See #123 for context"
```

#### Comment on Issue

```bash
gh-sim comment issue [options]
```

**Options:**
- `-i, --issue <num>` - Issue number
- `-b, --body <body>` - Comment body

**Examples:**
```bash
# Simple comment
gh-sim comment issue

# With issue number
gh-sim comment issue -i 5

# With message
gh-sim comment issue -i 5 -b "I can reproduce this"
```

---

## Common Workflows

### Rapid Testing - Multiple Commits

```bash
# Push 5 commits at once
gh-sim push -c 5
```

### Complete PR Lifecycle

```bash
# 1. Create draft PR
gh-sim pr open -n 1 -t "New Feature" -d

# 2. Add comment
gh-sim comment pr -p 1 -b "Ready for review"

# 3. Mark as ready
gh-sim pr ready -n 1

# 4. Request changes during review
gh-sim review request-changes -p 1 -b "Minor fixes needed"

# 5. Approve
gh-sim review approve -p 1

# 6. Merge
gh-sim pr merge -n 1
```

### Issue Tracking

```bash
# 1. Report a bug
gh-sim issue open -n 1 -t "Bug: Login fails" -b "Steps to reproduce..."

# 2. Add comment
gh-sim comment issue -i 1 -b "I can confirm this"

# 3. Close when fixed
gh-sim issue close -n 1
```

### Testing Multiple Events

```bash
# Combine push, PR, and review
gh-sim push && \
gh-sim pr open && \
gh-sim review approve -p 1
```

---

## Configuration

### File Location

```
.claude/config.local.json
```

### Required Structure

```json
{
  "github": {
    "userId": 12345678,
    "username": "your-username",
    "email": "user@example.com",
    "displayName": "Your Name",
    "nodeId": "MDQ6VXNlcjEyMzQ1Njc4"
  },
  "codeheroes": {
    "userId": "1000002"
  },
  "testRepository": {
    "id": 987654321,
    "name": "your-test-repo",
    "owner": "your-username",
    "fullName": "your-username/your-test-repo",
    "nodeId": "R_kgDOQ_7IHg"
  }
}
```

### Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `github.userId` | number | Your GitHub user ID |
| `github.username` | string | Your GitHub username |
| `github.email` | string | Your email |
| `github.displayName` | string | Your display name |
| `github.nodeId` | string | GitHub node ID (base64) |
| `codeheroes.userId` | string | Your CodeHeroes user ID |
| `testRepository.id` | number | Test repo ID |
| `testRepository.name` | string | Repository name |
| `testRepository.owner` | string | Repository owner |
| `testRepository.fullName` | string | owner/name format |
| `testRepository.nodeId` | string | Repository node ID |

---

## Webhook Delivery

**Target:** `http://localhost:5001/your-project-id/europe-west1/gitHubReceiver`

**Method:** POST

**Headers:**
- `Content-Type: application/json`
- `X-GitHub-Event: <event-type>`
- `X-GitHub-Delivery: <unique-id>`
- `User-Agent: GitHub-Hookshot/simulate`

**Requirements:**
- Firebase emulator running on `localhost:5001`
- Valid config file at `.claude/config.local.json`

---

## Troubleshooting

### Issue: "Emulator not available"

**Error Message:**
```
Firebase emulator not reachable at http://localhost:5001
Start the emulators with: nx serve firebase-app
```

**Solution:**
```bash
# Start the emulator
nx serve firebase-app
```

### Issue: "Config file not found"

**Error Message:**
```
Config file not found. Expected: .claude/config.local.json
```

**Solution:**
1. Create `.claude/config.local.json`
2. Fill in all required fields (see Configuration section above)

### Issue: "Unknown command"

**Solution:**
```bash
# View available commands
gh-sim --help

# View command-specific help
gh-sim push --help
gh-sim pr --help
```

### Issue: "Command failed with non-zero exit code"

**Solution:**
1. Check that the emulator is running
2. Use `--verbose` flag to see detailed output:
   ```bash
   gh-sim --verbose push
   ```
3. Check config file is valid JSON

---

## Advanced Usage

### Verbose Output

See full HTTP request and response details:

```bash
gh-sim --verbose push
gh-sim --verbose pr open -t "Feature"
```

### Skip Emulator Check

For testing or CI/CD without emulator validation:

```bash
gh-sim --no-validate push
gh-sim --no-validate pr open
```

### Combine with Shell Scripting

Run multiple events in a loop:

```bash
#!/bin/bash

# Create 5 issues
for i in {1..5}; do
  gh-sim issue open -n $i -t "Issue #$i"
done

# Create and merge a PR
gh-sim pr open -n 100 -t "Automated PR"
gh-sim pr merge -n 100
```

---

## Test Results

- **Total Tests:** 132
- **Passed:** 132 (100%)
- **Failed:** 0
- **Status:** Production-ready

See [test-report-2025-01-24.md](./test-report-2025-01-24.md) for full test details.

---

## More Information

- Full test report: [test-report-2025-01-24.md](./test-report-2025-01-24.md)
- Codebase structure: [architecture.md](./architecture.md)
- Main documentation: [../../docs/local-development/](../../../docs/local-development/)
