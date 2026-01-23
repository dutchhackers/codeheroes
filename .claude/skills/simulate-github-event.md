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
```

### 3. Build and send the request

Construct the payload using values from the config file, then send:

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

### 4. Report the result

After sending, report:
- **Success:** "Simulated push event sent successfully. Response: {response body}"
- **Failure:** "Failed to send simulated event. Error: {error details}"

Include the delivery ID used so it can be referenced later.

## Example Output

```
Simulating GitHub push event...
Delivery ID: simulate-1706123456-a1b2c3d4
Commit SHA: 8f4a2b1c9d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a

Response: Event processed successfully

Push event simulated successfully.
```

## Configuration

The skill reads from `.claude/config.local.json`. This file is gitignored to keep personal data out of the repository.

To set up:
1. Copy `.claude/config.example.json` to `.claude/config.local.json`
2. Fill in your GitHub user ID, username, email, and test repository details
3. Ensure your GitHub user ID is mapped in the database seed data

## Future Enhancements

- Support for other event types: `pull_request`, `issues`, `pull_request_review`
- Configurable commit message
- Multiple commits in one push
