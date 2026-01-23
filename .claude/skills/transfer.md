# Transfer

Hand off the current session context to a new Claude session in the same project.

**Portability:** Works with any LLM that can read markdown files

---

## Overview

Transfer creates a `HANDOFF.md` file in the project root that captures the current session's context, decisions, and next steps. A new Claude session can then pick up exactly where you left off.

**Typical requests:**
- "Transfer this session"
- "/transfer"
- "Create a handoff for the next session"
- "I need to stop, transfer my progress"

---

## On Activation

### 1. Gather Context

Collect from the current session:

- **Project:** Identify from the working directory or CLAUDE.md
- **Goal:** What were we trying to accomplish this session?
- **Summary:** What was discussed, explored, or built
- **Completed:** What was finished
- **Remaining:** What still needs to be done
- **Decisions:** Key choices made during the session
- **Files touched:** Files that were created, modified, or are relevant
- **Current state:** Where things stand right now

### 2. Write HANDOFF.md

Write to the project root `HANDOFF.md`:

```markdown
# Session Handoff

**Project:** [project name]
**Date:** [YYYY-MM-DD HH:mm]
**Goal:** [one-line summary of session goal]

## Context

[2-3 sentences summarizing what was discussed and the current state]

## Completed This Session

- [What was accomplished]
- [...]

## Remaining Work

1. [Next step / what remains to be done]
2. [...]
3. [...]

## Decisions Made

- [Key decision 1 and why]
- [Key decision 2 and why]

## Relevant Files

- `path/to/file` - [why it's relevant / what changed]
- `path/to/file` - [why it's relevant / what changed]

## Current State

[Describe the current state - what's running, what's configured, any active processes]

## Start Here

[Clear instruction for where a new session should begin - be specific]

---
*Session handoff document. Delete after use.*
```

### 3. Confirm

Output:
```
Handoff written to: HANDOFF.md

To continue in a new session:
  claude "Read HANDOFF.md and continue where we left off"

Or simply start claude and say:
  "Read HANDOFF.md and let's continue"
```

---

## Content Guidelines

### Be Specific
- Don't just say "continue the work" - specify exactly what to do next
- Include file paths, function names, specific tasks
- Mention any gotchas or things that didn't work

### Capture State
- Are emulators running? Which ports?
- Is ngrok active? What's the URL?
- Any background processes?
- Database state (seeded? cleared?)

### Include Context
- Why were certain decisions made?
- What approaches were tried and rejected?
- Any relevant error messages or logs

### Keep It Actionable
- The "Start Here" section should be immediately actionable
- First task should be clear and concrete
- Avoid vague instructions

---

## Examples

### Basic Transfer
```
/transfer
```
Creates HANDOFF.md with full session context.

### With Specific Goal
User says: "Transfer this, we were debugging the webhook flow"

Creates HANDOFF.md with that context emphasized.

---

## Integration Notes

- HANDOFF.md is already in `.gitignore` patterns (if not, recommend adding)
- The file should be deleted after the new session reads it
- Works alongside CLAUDE.md (HANDOFF.md is temporary, CLAUDE.md is permanent)

---

## Limitations

- One-way transfer (snapshot, not live)
- New session must be told to read the file
- Context may become stale if project state changes between sessions
- Does not transfer actual running processes (just documents them)

---

**Last Updated:** 2026-01-23
