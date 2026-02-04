# Previous UI Design: Cyberpunk/Neon Theme

This document captures the design aesthetic of the Code Heroes UI before the mobile-first redesign in PR #282.

## Reference Point

- **Last commit with this design**: `95dc559` (main branch before PR #282)
- **GitHub link**: https://github.com/dutchhackers/codeheroes/tree/95dc559
- **To view the old code**: `git show 95dc559:<filepath>`
- **To restore**: `git checkout 95dc559 -- <filepath>`

## Design Philosophy

The original design followed a **cyberpunk/neon aesthetic** with:
- Dark backgrounds with subtle transparency (`bg-black/70`)
- Neon glow effects on borders and text
- Tech-inspired typography (JetBrains Mono for data)
- Color-coded activity types with corresponding glows
- Cyber-style avatar effects with tinted overlays

## Key Visual Elements

### 1. Card Glow Effects

Cards had colored glow borders based on activity type:

```css
.card-glow-cyan {
  border: 1px solid var(--neon-cyan);
  box-shadow:
    0 0 10px color-mix(in srgb, var(--neon-cyan) 30%, transparent),
    inset 0 0 20px color-mix(in srgb, var(--neon-cyan) 5%, transparent);
}
```

### 2. Activity Item Layout

Activity cards used a complex layout with:
- Icon position logic (left for badges, right for regular activities)
- Avatar with cyber glow wrapper
- Single-color text matching the activity type
- Footer separator with repo name and XP

```html
<div class="rounded-lg bg-black/70 cursor-pointer" [class]="actionDisplay().cardGlowClass">
  <!-- Icon on LEFT or RIGHT based on type -->
  <!-- Avatar with cyber-avatar-wrapper -->
  <!-- Description text in activity color -->
  <!-- Footer with separator line -->
</div>
```

### 3. Cyber Avatar Styling

Avatars had a glowing border effect:

```css
.cyber-avatar-wrapper {
  position: relative;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(135deg, var(--glow-color), transparent);
  box-shadow: 0 0 12px var(--glow-color);
}

.cyber-avatar-tint {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--glow-color), transparent);
  opacity: 0.15;
  pointer-events: none;
}
```

### 4. Progress Bar

Daily progress bar with gradient and glow:

```css
.progress-bar {
  background: linear-gradient(90deg, var(--neon-cyan), var(--neon-purple));
  box-shadow: 0 0 12px var(--neon-cyan);
}

.progress-bar.goal-reached {
  background: linear-gradient(90deg, var(--neon-green), var(--neon-cyan));
  box-shadow: 0 0 16px var(--neon-green);
}
```

### 5. Neon Color Palette

```css
:root {
  --neon-cyan: #00f5ff;
  --neon-purple: #bf00ff;
  --neon-green: #39ff14;
  --neon-yellow: #ffdd00;
  --neon-orange: #ff6600;
  --neon-pink: #ff0080;
}
```

## Key Files (at commit 95dc559)

| File | Description |
|------|-------------|
| `components/activity-item.component.ts` | Activity card with glow effects, cyber avatars |
| `pages/hq/components/daily-progress.component.ts` | Neon progress bar |
| `pages/hq/components/weekly-stats.component.ts` | Stats grid with glow cards |
| `pages/hq/components/leaderboard-preview.component.ts` | Leaderboard with avatar glows |
| `styles.css` | Global neon CSS variables and card-glow classes |

## How to Restore

To bring back specific components:

```bash
# View the old file
git show 95dc559:apps/frontend/app/src/app/components/activity-item.component.ts

# Restore a specific file
git checkout 95dc559 -- apps/frontend/app/src/app/components/activity-item.component.ts

# Or create a branch from that point
git checkout -b feature/restore-cyberpunk-ui 95dc559
```

## Screenshots

_No screenshots captured. To see the design, checkout commit `95dc559` and run the app._
