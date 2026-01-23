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

## Instructions

When this skill is invoked, execute the following steps:

### 1. Generate the webhook payload

Create a GitHub push event payload with these values:

**Timestamps** - Use current time:
```bash
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
UNIX_TIMESTAMP=$(date +%s)
```

**Default user** (mschilling):
- GitHub ID: `7045335`
- Username: `mschilling`
- Email: `michael.schilling@framna.com`
- Display Name: `Michael Schilling`
- CodeHeroes User ID: `1000002`

**Repository:**
- ID: `1140770846`
- Name: `codeheroes-support`
- Owner: `mschilling`
- Full name: `mschilling/codeheroes-support`

### 2. Build and send the request

Use this bash command to send the webhook:

```bash
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
UNIX_TIMESTAMP=$(date +%s)
COMMIT_SHA=$(openssl rand -hex 20)
DELIVERY_ID="simulate-$(date +%s)-$(openssl rand -hex 4)"

curl -s -X POST "http://localhost:5001/codeheroes-app-test/europe-west1/gitHubReceiver" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: ${DELIVERY_ID}" \
  -d @- << 'PAYLOAD_END'
{
  "ref": "refs/heads/main",
  "before": "0000000000000000000000000000000000000000",
  "after": "COMMIT_SHA_PLACEHOLDER",
  "repository": {
    "id": 1140770846,
    "node_id": "R_kgDOQ_7IHg",
    "name": "codeheroes-support",
    "full_name": "mschilling/codeheroes-support",
    "private": true,
    "owner": {
      "name": "mschilling",
      "email": "mschilling@users.noreply.github.com",
      "login": "mschilling",
      "id": 7045335,
      "node_id": "MDQ6VXNlcjcwNDUzMzU=",
      "avatar_url": "https://avatars.githubusercontent.com/u/7045335?v=4",
      "url": "https://api.github.com/users/mschilling",
      "html_url": "https://github.com/mschilling",
      "type": "User",
      "site_admin": false
    },
    "html_url": "https://github.com/mschilling/codeheroes-support",
    "description": null,
    "fork": false,
    "url": "https://api.github.com/repos/mschilling/codeheroes-support",
    "created_at": UNIX_TIMESTAMP_PLACEHOLDER,
    "updated_at": "TIMESTAMP_PLACEHOLDER",
    "pushed_at": UNIX_TIMESTAMP_PLACEHOLDER,
    "git_url": "git://github.com/mschilling/codeheroes-support.git",
    "ssh_url": "git@github.com:mschilling/codeheroes-support.git",
    "clone_url": "https://github.com/mschilling/codeheroes-support.git",
    "default_branch": "main",
    "master_branch": "main"
  },
  "pusher": {
    "name": "mschilling",
    "email": "mschilling@users.noreply.github.com"
  },
  "sender": {
    "login": "mschilling",
    "id": 7045335,
    "node_id": "MDQ6VXNlcjcwNDUzMzU=",
    "avatar_url": "https://avatars.githubusercontent.com/u/7045335?v=4",
    "url": "https://api.github.com/users/mschilling",
    "html_url": "https://github.com/mschilling",
    "type": "User",
    "site_admin": false
  },
  "created": false,
  "deleted": false,
  "forced": false,
  "base_ref": null,
  "compare": "https://github.com/mschilling/codeheroes-support/compare/000000...COMMIT_SHA_PLACEHOLDER",
  "commits": [
    {
      "id": "COMMIT_SHA_PLACEHOLDER",
      "tree_id": "COMMIT_SHA_PLACEHOLDER",
      "distinct": true,
      "message": "test: simulated push event",
      "timestamp": "TIMESTAMP_PLACEHOLDER",
      "url": "https://github.com/mschilling/codeheroes-support/commit/COMMIT_SHA_PLACEHOLDER",
      "author": {
        "name": "Michael Schilling",
        "email": "michael.schilling@framna.com",
        "username": "mschilling"
      },
      "committer": {
        "name": "Michael Schilling",
        "email": "michael.schilling@framna.com",
        "username": "mschilling"
      },
      "added": ["simulated-file.txt"],
      "removed": [],
      "modified": []
    }
  ],
  "head_commit": {
    "id": "COMMIT_SHA_PLACEHOLDER",
    "tree_id": "COMMIT_SHA_PLACEHOLDER",
    "distinct": true,
    "message": "test: simulated push event",
    "timestamp": "TIMESTAMP_PLACEHOLDER",
    "url": "https://github.com/mschilling/codeheroes-support/commit/COMMIT_SHA_PLACEHOLDER",
    "author": {
      "name": "Michael Schilling",
      "email": "michael.schilling@framna.com",
      "username": "mschilling"
    },
    "committer": {
      "name": "Michael Schilling",
      "email": "michael.schilling@framna.com",
      "username": "mschilling"
    },
    "added": ["simulated-file.txt"],
    "removed": [],
    "modified": []
  }
}
PAYLOAD_END
```

**Important:** Before sending, replace these placeholders in the payload:
- `COMMIT_SHA_PLACEHOLDER` → the generated `$COMMIT_SHA`
- `TIMESTAMP_PLACEHOLDER` → the generated `$TIMESTAMP`
- `UNIX_TIMESTAMP_PLACEHOLDER` → the generated `$UNIX_TIMESTAMP`

### 3. Report the result

After sending, report:
- **Success:** "Simulated push event sent successfully. Response: {response body}"
- **Failure:** "Failed to send simulated event. Error: {error details}"

Include the delivery ID used so it can be referenced later.

## Prerequisites

- Firebase emulators must be running: `nx serve firebase-app`
- Database must be seeded with user data: `FIREBASE_PROJECT_ID=codeheroes-app-test nx seed database-seeds`

## Example Output

```
Simulating GitHub push event...
Delivery ID: simulate-1706123456-a1b2c3d4
Commit SHA: 8f4a2b1c9d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a

Response: Event processed successfully

Push event simulated successfully.
```

## Future Enhancements

- Support for other event types: `pull_request`, `issues`, `pull_request_review`
- Configurable user (pass different GitHub username/ID)
- Configurable commit message
- Multiple commits in one push
