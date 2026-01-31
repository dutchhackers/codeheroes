# GitHub Labels

This document describes the labels used in the Code Heroes repository for organizing issues and pull requests.

## Issue Type Labels

Labels that describe what kind of work an issue represents.

| Label | Color | Description |
|-------|-------|-------------|
| `bug` | ![#d73a4a](https://via.placeholder.com/15/d73a4a/d73a4a.png) `#d73a4a` | Something isn't working |
| `feature` | ![#a2eeef](https://via.placeholder.com/15/a2eeef/a2eeef.png) `#a2eeef` | New feature request |
| `enhancement` | ![#84b6eb](https://via.placeholder.com/15/84b6eb/84b6eb.png) `#84b6eb` | Improvement to existing feature |
| `documentation` | ![#0075ca](https://via.placeholder.com/15/0075ca/0075ca.png) `#0075ca` | Documentation updates |
| `refactor` | ![#fbca04](https://via.placeholder.com/15/fbca04/fbca04.png) `#fbca04` | Code refactoring |
| `tech-debt` | ![#e99695](https://via.placeholder.com/15/e99695/e99695.png) `#e99695` | Technical debt to address |
| `question` | ![#d876e3](https://via.placeholder.com/15/d876e3/d876e3.png) `#d876e3` | Further information requested |

## Priority Labels

Labels that indicate urgency and importance.

| Label | Color | Description |
|-------|-------|-------------|
| `priority: critical` | ![#b60205](https://via.placeholder.com/15/b60205/b60205.png) `#b60205` | Requires immediate attention |
| `priority: high` | ![#d93f0b](https://via.placeholder.com/15/d93f0b/d93f0b.png) `#d93f0b` | High priority |
| `priority: medium` | ![#fbca04](https://via.placeholder.com/15/fbca04/fbca04.png) `#fbca04` | Medium priority |
| `priority: low` | ![#0e8a16](https://via.placeholder.com/15/0e8a16/0e8a16.png) `#0e8a16` | Low priority |

## Component Labels

Labels that identify which part of the codebase an issue relates to.

### Applications

| Label | Color | Description |
|-------|-------|-------------|
| `app: web` | ![#5319e7](https://via.placeholder.com/15/5319e7/5319e7.png) `#5319e7` | Frontend web app (`apps/web`) |
| `app: activity-wall` | ![#5319e7](https://via.placeholder.com/15/5319e7/5319e7.png) `#5319e7` | Activity wall display (`apps/activity-wall`) |
| `app: api` | ![#1d76db](https://via.placeholder.com/15/1d76db/1d76db.png) `#1d76db` | REST API (`apps/api`) |
| `app: game-engine` | ![#1d76db](https://via.placeholder.com/15/1d76db/1d76db.png) `#1d76db` | Game logic/XP processing (`apps/game-engine`) |
| `app: github-receiver` | ![#1d76db](https://via.placeholder.com/15/1d76db/1d76db.png) `#1d76db` | Webhook handler (`apps/github-receiver`) |
| `app: github-simulator` | ![#1d76db](https://via.placeholder.com/15/1d76db/1d76db.png) `#1d76db` | GitHub event simulator CLI (`apps/github-simulator`) |

### Libraries

| Label | Color | Description |
|-------|-------|-------------|
| `lib: progression-engine` | ![#bfd4f2](https://via.placeholder.com/15/bfd4f2/bfd4f2.png) `#bfd4f2` | XP/leveling system (`libs/server/progression-engine`) |
| `lib: shared` | ![#bfd4f2](https://via.placeholder.com/15/bfd4f2/bfd4f2.png) `#bfd4f2` | Shared libraries (`libs/shared`) |
| `lib: server-common` | ![#bfd4f2](https://via.placeholder.com/15/bfd4f2/bfd4f2.png) `#bfd4f2` | Server utilities (`libs/server/common`) |

## Gamification Labels

Labels specific to the Code Heroes gamification features.

| Label | Color | Description |
|-------|-------|-------------|
| `xp-system` | ![#7057ff](https://via.placeholder.com/15/7057ff/7057ff.png) `#7057ff` | XP calculation and rewards |
| `badges` | ![#7057ff](https://via.placeholder.com/15/7057ff/7057ff.png) `#7057ff` | Badge and achievement system |
| `leaderboard` | ![#7057ff](https://via.placeholder.com/15/7057ff/7057ff.png) `#7057ff` | Ranking and leaderboard features |
| `milestones` | ![#7057ff](https://via.placeholder.com/15/7057ff/7057ff.png) `#7057ff` | Milestone tracking |

## Status Labels

Labels that track the current state of an issue.

| Label | Color | Description |
|-------|-------|-------------|
| `needs-triage` | ![#ededed](https://via.placeholder.com/15/ededed/ededed.png) `#ededed` | Needs initial review |
| `blocked` | ![#b60205](https://via.placeholder.com/15/b60205/b60205.png) `#b60205` | Blocked by dependency |
| `in-progress` | ![#0052cc](https://via.placeholder.com/15/0052cc/0052cc.png) `#0052cc` | Currently being worked on |
| `ready-for-review` | ![#0e8a16](https://via.placeholder.com/15/0e8a16/0e8a16.png) `#0e8a16` | Ready for code review |

## Size Labels

Labels that estimate the effort required for an issue.

| Label | Color | Description |
|-------|-------|-------------|
| `size: XS` | ![#c5def5](https://via.placeholder.com/15/c5def5/c5def5.png) `#c5def5` | Tiny task (< 1 hour) |
| `size: S` | ![#c5def5](https://via.placeholder.com/15/c5def5/c5def5.png) `#c5def5` | Small task (few hours) |
| `size: M` | ![#c5def5](https://via.placeholder.com/15/c5def5/c5def5.png) `#c5def5` | Medium task (~1 day) |
| `size: L` | ![#c5def5](https://via.placeholder.com/15/c5def5/c5def5.png) `#c5def5` | Large task (multi-day) |
| `size: XL` | ![#c5def5](https://via.placeholder.com/15/c5def5/c5def5.png) `#c5def5` | Extra large (major effort) |

## Special Labels

Labels for special categories and community contributions.

| Label | Color | Description |
|-------|-------|-------------|
| `good first issue` | ![#7057ff](https://via.placeholder.com/15/7057ff/7057ff.png) `#7057ff` | Good for newcomers |
| `help wanted` | ![#008672](https://via.placeholder.com/15/008672/008672.png) `#008672` | Extra attention needed |
| `wontfix` | ![#ffffff](https://via.placeholder.com/15/ffffff/ffffff.png) `#ffffff` | Won't be addressed |
| `duplicate` | ![#cfd3d7](https://via.placeholder.com/15/cfd3d7/cfd3d7.png) `#cfd3d7` | Duplicate issue |

## Technology Labels

Labels for specific technologies or integrations.

| Label | Color | Description |
|-------|-------|-------------|
| `firebase` | ![#FFA000](https://via.placeholder.com/15/FFA000/FFA000.png) `#FFA000` | Firebase-related |
| `github-integration` | ![#24292e](https://via.placeholder.com/15/24292e/24292e.png) `#24292e` | GitHub webhook/API |

## Label Usage Guidelines

### When Creating Issues

1. **Always add a type label** (`bug`, `feature`, `enhancement`, etc.)
2. **Add a component label** if the issue is specific to one area
3. **Add a priority label** if the urgency is known
4. **Add gamification labels** for XP, badge, or leaderboard related issues

### When Triaging Issues

1. Add `needs-triage` to new issues that need review
2. Once triaged, add appropriate priority and size labels
3. Add `good first issue` for issues suitable for new contributors

### During Development

1. Change status to `in-progress` when work begins
2. Add `blocked` if waiting on dependencies
3. Change to `ready-for-review` when PR is opened

## Managing Labels

Labels can be managed via the GitHub CLI:

```bash
# List all labels
gh label list --repo dutchhackers/codeheroes

# Create a new label
gh label create "label-name" --color "HEXCODE" --description "Description"

# Edit an existing label
gh label edit "label-name" --color "HEXCODE" --description "New description"

# Delete a label
gh label delete "label-name"
```
