---
description: "Automatically fixes and resolves review comments from bot reviewers (Copilot, GitHub Actions, Dependabot, etc.) on a pull request."
---

# Fix Bot Reviews

Automatically fixes and resolves review comments from bot reviewers (Copilot, GitHub Actions, Dependabot, etc.) on a pull request.

## Usage

```
/fix-bot-reviews [PR_NUMBER_OR_URL]
```

**Arguments:**
- `PR_NUMBER_OR_URL` (optional): PR number or full GitHub PR URL. Default: current branch's open PR

## What It Does

1. Fetches unresolved review threads from the PR
2. Filters to only bot authors (copilot-pull-request-reviewer, github-actions, dependabot, etc.)
3. Analyzes each comment and applies quick fixes where possible
4. Reports comments that need manual attention
5. Commits fixes with descriptive message
6. Pushes changes
7. Replies to each thread with fix description
8. Resolves the threads

## Bot Authors Detected

| Bot | Login Pattern |
|-----|---------------|
| GitHub Copilot | `copilot-pull-request-reviewer` |
| GitHub Actions | `github-actions[bot]` |
| Dependabot | `dependabot[bot]` |
| Renovate | `renovate[bot]` |
| CodeRabbit | `coderabbitai[bot]` |

## Instructions

When this skill is invoked, execute the following steps:

### 1. Determine PR number

If a PR number or URL is provided, extract the number. Otherwise, find the PR for the current branch:

```bash
# Get PR number for current branch
gh pr view --json number --jq '.number'
```

### 2. Fetch unresolved bot review comments

Use GitHub GraphQL API to get unresolved review threads:

```bash
gh api graphql -f query='
{
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(first: 50) {
        nodes {
          id
          isResolved
          path
          line
          comments(first: 5) {
            nodes {
              id
              body
              author {
                login
              }
            }
          }
        }
      }
    }
  }
}' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)'
```

### 3. Filter for bot authors

Keep only threads where the first comment author matches bot patterns:
- Contains `[bot]` suffix
- Equals `copilot-pull-request-reviewer`
- Contains `dependabot`, `renovate`, `github-actions`, `coderabbit`

### 4. Analyze and categorize comments

For each bot comment, determine if it's:

| Category | Action |
|----------|--------|
| **Quick Fix** | Documentation typo, comment update, type annotation | Auto-fix |
| **Code Fix** | Bug fix, logic error, missing null check | Auto-fix with care |
| **Performance** | Caching, optimization suggestions | Auto-fix |
| **Architecture** | Refactoring, design change | Report for manual review |
| **Security** | Vulnerability, auth issue | Report for manual review |

### 5. Apply fixes

For each fixable comment:
1. Read the relevant file
2. Apply the suggested fix (often provided in `suggestion` code blocks)
3. Track which files were modified

### 6. Commit and push

```bash
git add <modified-files>
git commit -m "fix: address bot review feedback (PR #NUMBER)

- <summary of fix 1>
- <summary of fix 2>
..."

git push origin <branch>
```

### 7. Reply and resolve threads

For each fixed comment:

```bash
# Reply with fix description
gh api graphql -f query='
mutation {
  addPullRequestReviewThreadReply(input: {
    pullRequestReviewThreadId: "THREAD_ID"
    body: "Fixed: <description of what was done>"
  }) { comment { id } }
}'

# Resolve the thread
gh api graphql -f query='
mutation {
  resolveReviewThread(input: {threadId: "THREAD_ID"}) {
    thread { isResolved }
  }
}'
```

### 8. Report results

Display a summary:

```
## Bot Review Summary (PR #NUMBER)

### Fixed (N comments)
| File | Issue | Status |
|------|-------|--------|
| path/to/file.ts:42 | Description | Fixed |

### Needs Manual Review (N comments)
| File | Issue | Reason |
|------|-------|--------|
| path/to/file.ts:100 | Architecture change | Requires design decision |
```

## Examples

### Fix bot reviews on current PR

```
/fix-bot-reviews
```

### Fix bot reviews on specific PR

```
/fix-bot-reviews 224
```

### Fix bot reviews using PR URL

```
/fix-bot-reviews https://github.com/owner/repo/pull/224
```

## Tips

- Run after pushing code to address Copilot's initial review
- Safe to run multiple times - only processes unresolved comments
- Commits are atomic - one commit per run with all fixes
- Comments marked "needs manual review" should be addressed by the developer

## Limitations

- Cannot fix comments requiring significant refactoring
- Cannot make architectural decisions
- Will not auto-merge or approve PRs
- Requires write access to the repository
