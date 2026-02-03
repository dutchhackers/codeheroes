# Active Projects Feature - "Weet wat er speelt"

## Overview

The "Weet wat er speelt" (Know what's happening) feature provides an engaging overview of active projects within the agency. It aggregates data from user activities to show which repositories are currently being worked on, who's contributing, and what types of activities are happening.

## Features

### Project Cards
Each project card displays:
- **Project Name**: Formatted from repository name (e.g., `my-awesome-app` → "My Awesome App")
- **Repository Owner**: The GitHub organization or user
- **Member Count**: Number of unique contributors
- **Activity Count**: Total number of activities in the time window
- **Activity Breakdown**: Visual badges showing:
  - 📤 Code pushes
  - 🔀 Pull requests
  - 👀 Code reviews
  - 🐛 Issues
  - 💬 Comments
- **Last Activity**: Time since last activity (e.g., "2h ago", "3d ago")
- **Pulse Indicator**: Real-time indicator for projects with activity in the last hour

### Summary Statistics
At the top of the page:
- **Total Active Projects**: Count of projects with recent activity
- **Total Contributors**: Unique count of all contributors across projects
- **Total Activities**: Sum of all activities across projects

## Data Model

### ActiveProject Interface
```typescript
interface ActiveProject {
  id: string;                    // Format: "owner/repo-name"
  name: string;                  // Repository name
  owner: string;                 // Repository owner
  displayName: string;           // User-facing name (formatted)
  memberCount: number;           // Unique contributors
  contributors: string[];        // Array of user IDs
  lastActivityAt: string;        // ISO timestamp
  activityCount: number;         // Total activities
  activityBreakdown: {
    pushes: number;
    pullRequests: number;
    reviews: number;
    issues: number;
    comments: number;
  };
  recentActivityDescription?: string;  // e.g., "2h ago"
}
```

## Service: ActiveProjectsService

### Methods

#### `getActiveProjects(daysBack = 7, maxActivities = 500)`
Fetches active projects from all users.
- **daysBack**: Number of days to look back for activities
- **maxActivities**: Maximum number of activities to fetch from Firestore
- **Returns**: `Observable<ActiveProject[]>`

#### `getUserActiveProjects(userId, daysBack = 30, maxActivities = 200)`
Fetches active projects for a specific user.
- **userId**: The user ID to filter by
- **daysBack**: Number of days to look back
- **maxActivities**: Maximum activities to fetch
- **Returns**: `Observable<ActiveProject[]>`

### Data Aggregation Logic

1. **Query Activities**: Fetches game actions from Firestore `gameActions` collection
2. **Filter**: Only processes activities with repository context
3. **Group**: Groups activities by `owner/repo-name`
4. **Aggregate**: For each project:
   - Counts unique contributors
   - Tracks last activity timestamp
   - Categorizes activity types
   - Calculates totals
5. **Sort**: Orders by most recent activity first

## Components

### ProjectsComponent (`/projects`)
Main page component that:
- Fetches active projects using `ActiveProjectsService`
- Displays summary statistics (computed signals)
- Renders project cards in a responsive grid
- Shows loading and empty states

### ProjectCardComponent
Reusable card component for displaying project information:
- Hover effects with neon borders
- Responsive design (mobile & desktop)
- Pulse animation for recent activity
- Accessible (ARIA labels, semantic HTML)

## Navigation

Added to bottom navigation bar:
- Icon: Cube/package icon (represents projects/repositories)
- Label: "PROJECTS"
- Route: `/projects`
- Position: Second tab (between HQ and Activity)

## Privacy & Security

### What's Shown
- Repository names and owners (already public in activities)
- Aggregate statistics (counts, timestamps)
- Activity type breakdowns

### What's NOT Shown
- Specific commit messages or code
- PR titles or descriptions
- Issue details
- Personal information
- Sensitive repository data

All data is derived from already-visible activities in the system, ensuring no additional sensitive information is exposed.

## Time Windows

- **Default view**: Last 7 days of activity
- **User projects**: Last 30 days of activity
- Configurable via service method parameters

## Responsive Design

### Mobile (< 768px)
- Single column grid
- Compact card layout
- Touch-friendly tap targets
- Optimized spacing

### Tablet/Desktop (≥ 768px)
- Multi-column grid (auto-fill, min 320px)
- Larger cards with more spacing
- Hover effects enabled
- Larger icons and text

## Styling

Consistent with app theme:
- Dark background (`rgba(0, 0, 0, 0.6)`)
- Neon purple borders (`rgba(191, 0, 255, 0.3)`)
- Cyan accents (`var(--neon-cyan, #00f5ff)`)
- JetBrains Mono font for labels/stats
- Smooth transitions and hover effects

## Future Enhancements

Possible improvements:
- Filter projects by technology/language
- Search functionality
- Project detail modal with activity timeline
- Export/share project stats
- Configurable time ranges (1d, 7d, 30d, all time)
- Favorite/pin projects
- Integration with GitHub API for additional metadata
