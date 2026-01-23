# Simulate GitHub Event

Simulates a GitHub webhook event and sends it directly to the local Firebase function endpoint.

## Usage

```
/simulate-github-event [event-type]
```

**Arguments:**
- `event-type` (optional): The GitHub event type. Default: `push`

**Supported events:**
- `push` - Simulates a code push to a branch
- `pr-open-draft` - Opens a new pull request as draft
- `pr-open` - Opens a new pull request (ready for review)
- `pr-close` - Closes a pull request

## Prerequisites

- Firebase emulators must be running: `nx serve firebase-app`
- Database must be seeded with user data: `FIREBASE_PROJECT_ID=codeheroes-app-test nx seed database-seeds`
- Config file must exist: `.claude/config.local.json` (copy from `.claude/config.example.json`)

## Instructions

When this skill is invoked, execute the following steps:

### 1. Load configuration

Read `.claude/config.local.json` to get user and repository details:

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
    "id": 123456789,
    "name": "your-test-repo",
    "owner": "your-github-username",
    "fullName": "your-github-username/your-test-repo",
    "nodeId": "R_kgDOAbCdEf"
  }
}
```

If the file doesn't exist, instruct the user to copy `.claude/config.example.json` to `.claude/config.local.json` and fill in their details.

### 2. Generate timestamps and identifiers

```bash
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
UNIX_TIMESTAMP=$(date +%s)
COMMIT_SHA=$(openssl rand -hex 20)
DELIVERY_ID="simulate-$(date +%s)-$(openssl rand -hex 4)"
PR_NUMBER=$((RANDOM % 900 + 100))  # Random PR number 100-999
```

### 3. Build and send the request

Construct the payload based on the event type using values from the config file.

---

#### Event: `push`

```bash
curl -s -X POST "http://localhost:5001/codeheroes-app-test/europe-west1/gitHubReceiver" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: ${DELIVERY_ID}" \
  -d '{
  "ref": "refs/heads/main",
  "before": "0000000000000000000000000000000000000000",
  "after": "${COMMIT_SHA}",
  "repository": {
    "id": ${config.testRepository.id},
    "node_id": "${config.testRepository.nodeId}",
    "name": "${config.testRepository.name}",
    "full_name": "${config.testRepository.fullName}",
    "private": true,
    "owner": {
      "name": "${config.github.username}",
      "email": "${config.github.username}@users.noreply.github.com",
      "login": "${config.github.username}",
      "id": ${config.github.userId},
      "node_id": "${config.github.nodeId}",
      "avatar_url": "https://avatars.githubusercontent.com/u/${config.github.userId}?v=4",
      "url": "https://api.github.com/users/${config.github.username}",
      "html_url": "https://github.com/${config.github.username}",
      "type": "User",
      "site_admin": false
    },
    "html_url": "https://github.com/${config.testRepository.fullName}",
    "description": null,
    "fork": false,
    "url": "https://api.github.com/repos/${config.testRepository.fullName}",
    "created_at": ${UNIX_TIMESTAMP},
    "updated_at": "${TIMESTAMP}",
    "pushed_at": ${UNIX_TIMESTAMP},
    "git_url": "git://github.com/${config.testRepository.fullName}.git",
    "ssh_url": "git@github.com:${config.testRepository.fullName}.git",
    "clone_url": "https://github.com/${config.testRepository.fullName}.git",
    "default_branch": "main",
    "master_branch": "main"
  },
  "pusher": {
    "name": "${config.github.username}",
    "email": "${config.github.username}@users.noreply.github.com"
  },
  "sender": {
    "login": "${config.github.username}",
    "id": ${config.github.userId},
    "node_id": "${config.github.nodeId}",
    "avatar_url": "https://avatars.githubusercontent.com/u/${config.github.userId}?v=4",
    "url": "https://api.github.com/users/${config.github.username}",
    "html_url": "https://github.com/${config.github.username}",
    "type": "User",
    "site_admin": false
  },
  "created": false,
  "deleted": false,
  "forced": false,
  "base_ref": null,
  "compare": "https://github.com/${config.testRepository.fullName}/compare/000000...${COMMIT_SHA}",
  "commits": [
    {
      "id": "${COMMIT_SHA}",
      "tree_id": "${COMMIT_SHA}",
      "distinct": true,
      "message": "test: simulated push event",
      "timestamp": "${TIMESTAMP}",
      "url": "https://github.com/${config.testRepository.fullName}/commit/${COMMIT_SHA}",
      "author": {
        "name": "${config.github.displayName}",
        "email": "${config.github.email}",
        "username": "${config.github.username}"
      },
      "committer": {
        "name": "${config.github.displayName}",
        "email": "${config.github.email}",
        "username": "${config.github.username}"
      },
      "added": ["simulated-file.txt"],
      "removed": [],
      "modified": []
    }
  ],
  "head_commit": {
    "id": "${COMMIT_SHA}",
    "tree_id": "${COMMIT_SHA}",
    "distinct": true,
    "message": "test: simulated push event",
    "timestamp": "${TIMESTAMP}",
    "url": "https://github.com/${config.testRepository.fullName}/commit/${COMMIT_SHA}",
    "author": {
      "name": "${config.github.displayName}",
      "email": "${config.github.email}",
      "username": "${config.github.username}"
    },
    "committer": {
      "name": "${config.github.displayName}",
      "email": "${config.github.email}",
      "username": "${config.github.username}"
    },
    "added": ["simulated-file.txt"],
    "removed": [],
    "modified": []
  }
}'
```

---

#### Event: `pr-open-draft`

Opens a new pull request as a draft. Use `X-GitHub-Event: pull_request` with `action: "opened"` and `draft: true`.

```bash
curl -s -X POST "http://localhost:5001/codeheroes-app-test/europe-west1/gitHubReceiver" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-GitHub-Delivery: ${DELIVERY_ID}" \
  -d '{
  "action": "opened",
  "number": ${PR_NUMBER},
  "pull_request": {
    "url": "https://api.github.com/repos/${config.testRepository.fullName}/pulls/${PR_NUMBER}",
    "id": '$(date +%s)',
    "node_id": "PR_simulated_'${DELIVERY_ID}'",
    "html_url": "https://github.com/${config.testRepository.fullName}/pull/${PR_NUMBER}",
    "diff_url": "https://github.com/${config.testRepository.fullName}/pull/${PR_NUMBER}.diff",
    "patch_url": "https://github.com/${config.testRepository.fullName}/pull/${PR_NUMBER}.patch",
    "issue_url": "https://api.github.com/repos/${config.testRepository.fullName}/issues/${PR_NUMBER}",
    "number": ${PR_NUMBER},
    "state": "open",
    "locked": false,
    "title": "test: simulated draft pull request",
    "user": {
      "login": "${config.github.username}",
      "id": ${config.github.userId},
      "node_id": "${config.github.nodeId}",
      "avatar_url": "https://avatars.githubusercontent.com/u/${config.github.userId}?v=4",
      "url": "https://api.github.com/users/${config.github.username}",
      "html_url": "https://github.com/${config.github.username}",
      "type": "User",
      "site_admin": false
    },
    "body": "This is a simulated draft pull request for testing.",
    "created_at": "${TIMESTAMP}",
    "updated_at": "${TIMESTAMP}",
    "closed_at": null,
    "merged_at": null,
    "merge_commit_sha": null,
    "assignee": null,
    "assignees": [],
    "requested_reviewers": [],
    "requested_teams": [],
    "labels": [],
    "milestone": null,
    "draft": true,
    "commits_url": "https://api.github.com/repos/${config.testRepository.fullName}/pulls/${PR_NUMBER}/commits",
    "review_comments_url": "https://api.github.com/repos/${config.testRepository.fullName}/pulls/${PR_NUMBER}/comments",
    "review_comment_url": "https://api.github.com/repos/${config.testRepository.fullName}/pulls/comments{/number}",
    "comments_url": "https://api.github.com/repos/${config.testRepository.fullName}/issues/${PR_NUMBER}/comments",
    "statuses_url": "https://api.github.com/repos/${config.testRepository.fullName}/statuses/${COMMIT_SHA}",
    "head": {
      "label": "${config.github.username}:feature-branch",
      "ref": "feature-branch",
      "sha": "${COMMIT_SHA}",
      "user": {
        "login": "${config.github.username}",
        "id": ${config.github.userId},
        "node_id": "${config.github.nodeId}",
        "avatar_url": "https://avatars.githubusercontent.com/u/${config.github.userId}?v=4",
        "type": "User"
      },
      "repo": {
        "id": ${config.testRepository.id},
        "node_id": "${config.testRepository.nodeId}",
        "name": "${config.testRepository.name}",
        "full_name": "${config.testRepository.fullName}",
        "private": true,
        "owner": {
          "login": "${config.github.username}",
          "id": ${config.github.userId},
          "node_id": "${config.github.nodeId}",
          "type": "User"
        },
        "html_url": "https://github.com/${config.testRepository.fullName}",
        "default_branch": "main"
      }
    },
    "base": {
      "label": "${config.github.username}:main",
      "ref": "main",
      "sha": "0000000000000000000000000000000000000000",
      "user": {
        "login": "${config.github.username}",
        "id": ${config.github.userId},
        "node_id": "${config.github.nodeId}",
        "type": "User"
      },
      "repo": {
        "id": ${config.testRepository.id},
        "node_id": "${config.testRepository.nodeId}",
        "name": "${config.testRepository.name}",
        "full_name": "${config.testRepository.fullName}",
        "private": true,
        "owner": {
          "login": "${config.github.username}",
          "id": ${config.github.userId},
          "node_id": "${config.github.nodeId}",
          "type": "User"
        },
        "html_url": "https://github.com/${config.testRepository.fullName}",
        "default_branch": "main"
      }
    },
    "author_association": "OWNER",
    "auto_merge": null,
    "active_lock_reason": null,
    "merged": false,
    "mergeable": null,
    "rebaseable": null,
    "mergeable_state": "unknown",
    "merged_by": null,
    "comments": 0,
    "review_comments": 0,
    "maintainer_can_modify": false,
    "commits": 1,
    "additions": 10,
    "deletions": 2,
    "changed_files": 1
  },
  "repository": {
    "id": ${config.testRepository.id},
    "node_id": "${config.testRepository.nodeId}",
    "name": "${config.testRepository.name}",
    "full_name": "${config.testRepository.fullName}",
    "private": true,
    "owner": {
      "login": "${config.github.username}",
      "id": ${config.github.userId},
      "node_id": "${config.github.nodeId}",
      "avatar_url": "https://avatars.githubusercontent.com/u/${config.github.userId}?v=4",
      "type": "User",
      "site_admin": false
    },
    "html_url": "https://github.com/${config.testRepository.fullName}",
    "description": null,
    "fork": false,
    "created_at": "${TIMESTAMP}",
    "updated_at": "${TIMESTAMP}",
    "pushed_at": "${TIMESTAMP}",
    "default_branch": "main"
  },
  "sender": {
    "login": "${config.github.username}",
    "id": ${config.github.userId},
    "node_id": "${config.github.nodeId}",
    "avatar_url": "https://avatars.githubusercontent.com/u/${config.github.userId}?v=4",
    "url": "https://api.github.com/users/${config.github.username}",
    "html_url": "https://github.com/${config.github.username}",
    "type": "User",
    "site_admin": false
  }
}'
```

---

#### Event: `pr-open`

Opens a new pull request ready for review (not a draft). Use `X-GitHub-Event: pull_request` with `action: "opened"` and `draft: false`.

```bash
curl -s -X POST "http://localhost:5001/codeheroes-app-test/europe-west1/gitHubReceiver" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-GitHub-Delivery: ${DELIVERY_ID}" \
  -d '{
  "action": "opened",
  "number": ${PR_NUMBER},
  "pull_request": {
    "url": "https://api.github.com/repos/${config.testRepository.fullName}/pulls/${PR_NUMBER}",
    "id": '$(date +%s)',
    "node_id": "PR_simulated_'${DELIVERY_ID}'",
    "html_url": "https://github.com/${config.testRepository.fullName}/pull/${PR_NUMBER}",
    "diff_url": "https://github.com/${config.testRepository.fullName}/pull/${PR_NUMBER}.diff",
    "patch_url": "https://github.com/${config.testRepository.fullName}/pull/${PR_NUMBER}.patch",
    "issue_url": "https://api.github.com/repos/${config.testRepository.fullName}/issues/${PR_NUMBER}",
    "number": ${PR_NUMBER},
    "state": "open",
    "locked": false,
    "title": "test: simulated pull request",
    "user": {
      "login": "${config.github.username}",
      "id": ${config.github.userId},
      "node_id": "${config.github.nodeId}",
      "avatar_url": "https://avatars.githubusercontent.com/u/${config.github.userId}?v=4",
      "url": "https://api.github.com/users/${config.github.username}",
      "html_url": "https://github.com/${config.github.username}",
      "type": "User",
      "site_admin": false
    },
    "body": "This is a simulated pull request for testing.",
    "created_at": "${TIMESTAMP}",
    "updated_at": "${TIMESTAMP}",
    "closed_at": null,
    "merged_at": null,
    "merge_commit_sha": null,
    "assignee": null,
    "assignees": [],
    "requested_reviewers": [],
    "requested_teams": [],
    "labels": [],
    "milestone": null,
    "draft": false,
    "commits_url": "https://api.github.com/repos/${config.testRepository.fullName}/pulls/${PR_NUMBER}/commits",
    "review_comments_url": "https://api.github.com/repos/${config.testRepository.fullName}/pulls/${PR_NUMBER}/comments",
    "review_comment_url": "https://api.github.com/repos/${config.testRepository.fullName}/pulls/comments{/number}",
    "comments_url": "https://api.github.com/repos/${config.testRepository.fullName}/issues/${PR_NUMBER}/comments",
    "statuses_url": "https://api.github.com/repos/${config.testRepository.fullName}/statuses/${COMMIT_SHA}",
    "head": {
      "label": "${config.github.username}:feature-branch",
      "ref": "feature-branch",
      "sha": "${COMMIT_SHA}",
      "user": {
        "login": "${config.github.username}",
        "id": ${config.github.userId},
        "node_id": "${config.github.nodeId}",
        "avatar_url": "https://avatars.githubusercontent.com/u/${config.github.userId}?v=4",
        "type": "User"
      },
      "repo": {
        "id": ${config.testRepository.id},
        "node_id": "${config.testRepository.nodeId}",
        "name": "${config.testRepository.name}",
        "full_name": "${config.testRepository.fullName}",
        "private": true,
        "owner": {
          "login": "${config.github.username}",
          "id": ${config.github.userId},
          "node_id": "${config.github.nodeId}",
          "type": "User"
        },
        "html_url": "https://github.com/${config.testRepository.fullName}",
        "default_branch": "main"
      }
    },
    "base": {
      "label": "${config.github.username}:main",
      "ref": "main",
      "sha": "0000000000000000000000000000000000000000",
      "user": {
        "login": "${config.github.username}",
        "id": ${config.github.userId},
        "node_id": "${config.github.nodeId}",
        "type": "User"
      },
      "repo": {
        "id": ${config.testRepository.id},
        "node_id": "${config.testRepository.nodeId}",
        "name": "${config.testRepository.name}",
        "full_name": "${config.testRepository.fullName}",
        "private": true,
        "owner": {
          "login": "${config.github.username}",
          "id": ${config.github.userId},
          "node_id": "${config.github.nodeId}",
          "type": "User"
        },
        "html_url": "https://github.com/${config.testRepository.fullName}",
        "default_branch": "main"
      }
    },
    "author_association": "OWNER",
    "auto_merge": null,
    "active_lock_reason": null,
    "merged": false,
    "mergeable": null,
    "rebaseable": null,
    "mergeable_state": "unknown",
    "merged_by": null,
    "comments": 0,
    "review_comments": 0,
    "maintainer_can_modify": false,
    "commits": 1,
    "additions": 10,
    "deletions": 2,
    "changed_files": 1
  },
  "repository": {
    "id": ${config.testRepository.id},
    "node_id": "${config.testRepository.nodeId}",
    "name": "${config.testRepository.name}",
    "full_name": "${config.testRepository.fullName}",
    "private": true,
    "owner": {
      "login": "${config.github.username}",
      "id": ${config.github.userId},
      "node_id": "${config.github.nodeId}",
      "avatar_url": "https://avatars.githubusercontent.com/u/${config.github.userId}?v=4",
      "type": "User",
      "site_admin": false
    },
    "html_url": "https://github.com/${config.testRepository.fullName}",
    "description": null,
    "fork": false,
    "created_at": "${TIMESTAMP}",
    "updated_at": "${TIMESTAMP}",
    "pushed_at": "${TIMESTAMP}",
    "default_branch": "main"
  },
  "sender": {
    "login": "${config.github.username}",
    "id": ${config.github.userId},
    "node_id": "${config.github.nodeId}",
    "avatar_url": "https://avatars.githubusercontent.com/u/${config.github.userId}?v=4",
    "url": "https://api.github.com/users/${config.github.username}",
    "html_url": "https://github.com/${config.github.username}",
    "type": "User",
    "site_admin": false
  }
}'
```

---

#### Event: `pr-close`

Closes a pull request (not merged). Use `X-GitHub-Event: pull_request` with `action: "closed"` and `merged: false`.

```bash
curl -s -X POST "http://localhost:5001/codeheroes-app-test/europe-west1/gitHubReceiver" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-GitHub-Delivery: ${DELIVERY_ID}" \
  -d '{
  "action": "closed",
  "number": ${PR_NUMBER},
  "pull_request": {
    "url": "https://api.github.com/repos/${config.testRepository.fullName}/pulls/${PR_NUMBER}",
    "id": '$(date +%s)',
    "node_id": "PR_simulated_'${DELIVERY_ID}'",
    "html_url": "https://github.com/${config.testRepository.fullName}/pull/${PR_NUMBER}",
    "diff_url": "https://github.com/${config.testRepository.fullName}/pull/${PR_NUMBER}.diff",
    "patch_url": "https://github.com/${config.testRepository.fullName}/pull/${PR_NUMBER}.patch",
    "issue_url": "https://api.github.com/repos/${config.testRepository.fullName}/issues/${PR_NUMBER}",
    "number": ${PR_NUMBER},
    "state": "closed",
    "locked": false,
    "title": "test: simulated pull request",
    "user": {
      "login": "${config.github.username}",
      "id": ${config.github.userId},
      "node_id": "${config.github.nodeId}",
      "avatar_url": "https://avatars.githubusercontent.com/u/${config.github.userId}?v=4",
      "url": "https://api.github.com/users/${config.github.username}",
      "html_url": "https://github.com/${config.github.username}",
      "type": "User",
      "site_admin": false
    },
    "body": "This is a simulated pull request for testing.",
    "created_at": "${TIMESTAMP}",
    "updated_at": "${TIMESTAMP}",
    "closed_at": "${TIMESTAMP}",
    "merged_at": null,
    "merge_commit_sha": null,
    "assignee": null,
    "assignees": [],
    "requested_reviewers": [],
    "requested_teams": [],
    "labels": [],
    "milestone": null,
    "draft": false,
    "commits_url": "https://api.github.com/repos/${config.testRepository.fullName}/pulls/${PR_NUMBER}/commits",
    "review_comments_url": "https://api.github.com/repos/${config.testRepository.fullName}/pulls/${PR_NUMBER}/comments",
    "review_comment_url": "https://api.github.com/repos/${config.testRepository.fullName}/pulls/comments{/number}",
    "comments_url": "https://api.github.com/repos/${config.testRepository.fullName}/issues/${PR_NUMBER}/comments",
    "statuses_url": "https://api.github.com/repos/${config.testRepository.fullName}/statuses/${COMMIT_SHA}",
    "head": {
      "label": "${config.github.username}:feature-branch",
      "ref": "feature-branch",
      "sha": "${COMMIT_SHA}",
      "user": {
        "login": "${config.github.username}",
        "id": ${config.github.userId},
        "node_id": "${config.github.nodeId}",
        "avatar_url": "https://avatars.githubusercontent.com/u/${config.github.userId}?v=4",
        "type": "User"
      },
      "repo": {
        "id": ${config.testRepository.id},
        "node_id": "${config.testRepository.nodeId}",
        "name": "${config.testRepository.name}",
        "full_name": "${config.testRepository.fullName}",
        "private": true,
        "owner": {
          "login": "${config.github.username}",
          "id": ${config.github.userId},
          "node_id": "${config.github.nodeId}",
          "type": "User"
        },
        "html_url": "https://github.com/${config.testRepository.fullName}",
        "default_branch": "main"
      }
    },
    "base": {
      "label": "${config.github.username}:main",
      "ref": "main",
      "sha": "0000000000000000000000000000000000000000",
      "user": {
        "login": "${config.github.username}",
        "id": ${config.github.userId},
        "node_id": "${config.github.nodeId}",
        "type": "User"
      },
      "repo": {
        "id": ${config.testRepository.id},
        "node_id": "${config.testRepository.nodeId}",
        "name": "${config.testRepository.name}",
        "full_name": "${config.testRepository.fullName}",
        "private": true,
        "owner": {
          "login": "${config.github.username}",
          "id": ${config.github.userId},
          "node_id": "${config.github.nodeId}",
          "type": "User"
        },
        "html_url": "https://github.com/${config.testRepository.fullName}",
        "default_branch": "main"
      }
    },
    "author_association": "OWNER",
    "auto_merge": null,
    "active_lock_reason": null,
    "merged": false,
    "mergeable": null,
    "rebaseable": null,
    "mergeable_state": "unknown",
    "merged_by": null,
    "comments": 0,
    "review_comments": 0,
    "maintainer_can_modify": false,
    "commits": 1,
    "additions": 10,
    "deletions": 2,
    "changed_files": 1
  },
  "repository": {
    "id": ${config.testRepository.id},
    "node_id": "${config.testRepository.nodeId}",
    "name": "${config.testRepository.name}",
    "full_name": "${config.testRepository.fullName}",
    "private": true,
    "owner": {
      "login": "${config.github.username}",
      "id": ${config.github.userId},
      "node_id": "${config.github.nodeId}",
      "avatar_url": "https://avatars.githubusercontent.com/u/${config.github.userId}?v=4",
      "type": "User",
      "site_admin": false
    },
    "html_url": "https://github.com/${config.testRepository.fullName}",
    "description": null,
    "fork": false,
    "created_at": "${TIMESTAMP}",
    "updated_at": "${TIMESTAMP}",
    "pushed_at": "${TIMESTAMP}",
    "default_branch": "main"
  },
  "sender": {
    "login": "${config.github.username}",
    "id": ${config.github.userId},
    "node_id": "${config.github.nodeId}",
    "avatar_url": "https://avatars.githubusercontent.com/u/${config.github.userId}?v=4",
    "url": "https://api.github.com/users/${config.github.username}",
    "html_url": "https://github.com/${config.github.username}",
    "type": "User",
    "site_admin": false
  }
}'
```

---

### 4. Report the result

After sending, report:
- **Success:** "Simulated push event sent successfully. Response: {response body}"
- **Failure:** "Failed to send simulated event. Error: {error details}"

Include the delivery ID used so it can be referenced later.

## Example Output

**Push event:**
```
Simulating GitHub push event...
Delivery ID: simulate-1706123456-a1b2c3d4
Commit SHA: 8f4a2b1c9d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a

Response: Event processed successfully

Push event simulated successfully.
```

**Pull request event:**
```
Simulating GitHub pull_request event (pr-open-draft)...
Delivery ID: simulate-1706123456-a1b2c3d4
PR Number: 542
Commit SHA: 8f4a2b1c9d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a

Response: Event processed successfully

Pull request (draft) opened successfully.
```

## Configuration

The skill reads from `.claude/config.local.json`. This file is gitignored to keep personal data out of the repository.

To set up:
1. Copy `.claude/config.example.json` to `.claude/config.local.json`
2. Fill in your GitHub user ID, username, email, and test repository details
3. Ensure your GitHub user ID is mapped in the database seed data

## Future Enhancements

- Support for additional event types: `issues`, `pull_request_review`, `pr-merge`
- Configurable commit message and PR title
- Multiple commits in one push
