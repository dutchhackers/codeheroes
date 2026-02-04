# Commit Story Generator

This script analyzes Git commit history from the last 30 days and generates a narrative story summarizing the development activity.

## Features

- 📊 Scans all commits from the last month
- 📅 Groups commits by week
- ✍️ Generates 1-2 paragraph stories for each week
- 📝 Categorizes commits (features, fixes, dependencies, etc.)
- 📄 Outputs a formatted Markdown file

## Usage

Run the script using npm:

```bash
npm run story
```

Or directly with Node.js:

```bash
node scripts/generate-commit-story.js
```

## Output

The script generates a file named `{month}-{year}-story.md` in the root directory with:

- A title summarizing the month
- An overview of total commits and date range
- Weekly sections with:
  - Date ranges and commit counts
  - Narrative stories (1-2 paragraphs each)
  - Detailed commit lists with authors

## Example Output

```markdown
# February 2026: A Month of Progress

## Overview

This month saw 15 commits across 3 weeks (2/1/2026 - 2/21/2026).

## Week 1
*2/1/2026 - 2/7/2026 • 5 commits*

This week brought 5 commits to the codebase, with contributions from Alice and Bob...

### Commits
- `abc1234` feat: add new feature (Alice)
- `def5678` fix: resolve bug (Bob)
...
```

## How It Works

1. **Fetch Commits**: Uses `git log` to retrieve commits from the last 30 days
2. **Group by Week**: Organizes commits into weekly buckets
3. **Analyze**: Categorizes commits by type (features, fixes, dependencies, etc.)
4. **Generate Story**: Creates narrative summaries based on commit patterns
5. **Output**: Writes formatted Markdown to a file

## Customization

The script can be modified to:
- Change the time period (default: 30 days)
- Adjust story generation logic
- Customize output format
- Filter specific commit types

## Notes

- The generated `*-story.md` files are ignored by Git (see `.gitignore`)
- Merge commits are excluded from the analysis
- Authors are extracted from commit metadata
- Commit messages are analyzed for keywords to determine categories
