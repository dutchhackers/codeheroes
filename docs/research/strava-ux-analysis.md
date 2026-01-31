# Strava UX Analysis for Code Heroes

> **Date:** January 2026
> **Purpose:** Analyze Strava's mobile app UX patterns for inspiration on Code Heroes Activity Wall improvements
> **Related Issues:** #228, #229, #230, #231, #232

---

## Executive Summary

Strava is a fitness tracking app with excellent gamification and social features. This analysis identifies patterns that could enhance Code Heroes' engagement and user experience.

### Key Takeaways

1. **Multi-period stats** - Users can compare This Week / Last Week / Month / Year / All-Time
2. **Personal Records** - Prominent display of personal bests creates goals to beat
3. **Social reactions** - One-tap "Kudos" creates low-friction engagement
4. **Streaks** - Visible streak counters encourage daily consistency
5. **Challenges** - Time-limited competitions with rewards drive participation
6. **Rich activity cards** - Inline stats make activities more interesting

---

## 1. Navigation Structure

### Main Navigation (Hamburger Menu)
| Section | Items |
|---------|-------|
| **Main** | Dashboard, Activity Feed, Clubs, My Segments, My Routes |
| **Training** | My Goals, Training Calendar, My Activities, Training Log, Training Plans, Power Curve, Fitness & Freshness |
| **Social** | Challenges, Find Friends |
| **Profile** | My Profile, Settings, Apps |

### Bottom Navigation (Mobile)
Not visible in web version, but mobile app uses:
- Home (Feed)
- Maps
- Record
- Groups
- You (Profile)

**Insight for Code Heroes:** Current bottom nav (Feed, HQ, Profile) is appropriately simple. Could add "Challenges" tab in future.

---

## 2. Profile Page Structure

### Profile Header
- **Photo banner** - Collage of activity photos
- **Avatar** - Overlaps banner (prominent)
- **Name + "Member Since" date**
- **Quick stats:** Following / Followers / Activities count

### Last 4 Weeks Summary
```
┌─────────────────────────────────────┐
│ Last 4 Weeks          M T W T F S S │
│                       ░ ░ █ ░ ░ █ ░ │
│    0                  ░ ░ ░ ░ █ ░ ░ │
│ Total Activities      ░ █ ░ ░ ░ ░ █ │
│                       ░ ░ ░ █ ░ ░ ░ │
└─────────────────────────────────────┘
```
- Activity count for period
- Calendar grid showing daily activity (similar to GitHub contribution graph)
- Activity type icons with legend

### Profile Tabs
- **Overview** - Main stats page
- **Trophy Case** - All earned badges
- **Following** - Social connections
- **KOMs / CRs / Top 10s** - Leaderboard positions
- **Local Legends** - Segment achievements
- **Posts** - User's posts/updates

---

## 3. Stats Organization

### My Stats Section
```
┌─────────────────────────────────────────┐
│ MY STATS                                │
│ [Ride] [Run] [Swim] [Walk]  ← Tabs      │
├─────────────────────────────────────────┤
│ Last 4 Weeks                            │
│   Activities/Week: 3                    │
│   Avg Distance/Week: 25 km              │
│   Elev Gain/Week: 450 m                 │
│   Avg Time/Week: 2h 30m                 │
├─────────────────────────────────────────┤
│ Best Efforts (Personal Records!)        │
│   Longest Ride: 25.2 km                 │
│   Biggest Climb: 52 m                   │
│   5 mile: 27:37                         │
│   10K: 52:19                            │
│   10 mile: 1:40:08                      │
│   20K: 1:58:05                          │
├─────────────────────────────────────────┤
│ 2026 (Current Year)                     │
│   Activities: 45                        │
│   Distance: 890 km                      │
│   Elev Gain: 4,500 m                    │
│   Time: 45h 30m                         │
├─────────────────────────────────────────┤
│ All-Time                                │
│   Activities: 779                       │
│   Distance: 4,320 km                    │
│   Elev Gain: 28,000 m                   │
│   Time: 320h                            │
└─────────────────────────────────────────┘
```

### Code Heroes Equivalent
```
┌─────────────────────────────────────────┐
│ MY STATS                                │
│ [PRs] [Reviews] [Issues] [All]          │
├─────────────────────────────────────────┤
│ Last 4 Weeks                            │
│   PRs/Week: 3                           │
│   Reviews/Week: 8                       │
│   Avg XP/Week: 4,200                    │
│   Active Days/Week: 4                   │
├─────────────────────────────────────────┤
│ Personal Records 🏆                     │
│   Most PRs in a Day: 5                  │
│   Most Reviews in a Day: 12             │
│   Largest PR: 45 files                  │
│   Best Day XP: 4,800                    │
│   Longest Streak: 23 days               │
├─────────────────────────────────────────┤
│ 2026                                    │
│   Total PRs: 45                         │
│   Total Reviews: 120                    │
│   Total XP: 124,000                     │
├─────────────────────────────────────────┤
│ All-Time                                │
│   Total PRs: 234                        │
│   Total XP: 890,000                     │
│   Level: 42                             │
└─────────────────────────────────────────┘
```

---

## 4. Activity Year Chart

### Features
- **Bar chart** showing activity per week/month
- **Metric toggles:** Time / Distance / Elev Gain
- **Period toggles:** Weekly / Monthly
- **Year selector:** Click to view any previous year
- **Interactive:** Click a bar to see that period's details

### Visual Design
```
Activities for 27 Oct 2025 - 2 Nov 2025
27 Jan 2025 - 26 Jan 2026

4.9 km | 0h 57m | 7 m

     ▁▃█▂▅▁▂▃▁▄▂▁▃▂█▁▃▂▁▂▃▁▄▅▂▁▃▂▁
     Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec Jan Feb

[Time] [Distance] [Elev Gain]    [Weekly] [Monthly]
```

---

## 5. Goals System

### Weekly Progress Goals
```
┌─────────────────────────────────────┐
│ This Week                           │
│                                     │
│ 15.0 / 40 km        ████████░░ 38% │
│ 1h 6m  250 m                        │
│                                     │
│ M  T  W  T  F  S  S                │
│ ▁  ▃  █  ▂  ▅  ░  ░                │
│                    ◯ Running        │
└─────────────────────────────────────┘
```

**Features:**
- Progress bar with current/target
- Daily breakdown visualization
- Circular progress indicator per activity type
- Supporting stats (time, elevation)

### Segment Goals
- Set time goals for specific segments (routes)
- Deadline to achieve the goal
- Map preview of the segment

### Power Goals (Cycling)
- Power output targets for time intervals
- Curve visualization

### Code Heroes Goal Ideas
- **Weekly XP Goal:** "Earn 5,000 XP this week"
- **PR Goal:** "Merge 5 PRs this week"
- **Review Goal:** "Complete 10 reviews this week"
- **Streak Goal:** "Stay active for 7 consecutive days"

---

## 6. Challenges System

### Challenge Card Structure
```
┌─────────────────────────────────────┐
│ [Sponsor Logo]        [Hero Image]  │
│                                     │
│ Samsung Train Better. Sleep Better. │
│                                     │
│ 📋 Record 260 minutes of activity   │
│ 🎁 Get a 15% Samsung voucher        │
│ 📅 1 Jan 2026 to 31 Jan 2026        │
│                                     │
│ 👥 2 friends have joined            │
│                                     │
│ [       Join Challenge        ]     │
└─────────────────────────────────────┘
```

### Challenge Types
| Type | Example |
|------|---------|
| **Duration** | Log 200 minutes of activity |
| **Distance** | Run 100K in February |
| **Frequency** | 10 days active in a month |
| **Single effort** | Complete a 5K run |

### Filter Options
- Activity type: Run, Ride, Swim, Walk, Hike, Workout
- Metric: Distance, Elapsed Time, Elevation Gain, Moving Time

### Social Features
- "X friends have joined" social proof
- Friends' avatars shown
- Share challenge completion

### Code Heroes Challenge Ideas
- **"February PR Marathon"** - Merge 20 PRs in February
- **"Review Champion"** - Complete 50 code reviews
- **"10 Days Active"** - Log activity on 10 separate days
- **"Team Sprint"** - Team completes 100 activities combined
- **"First Timer"** - Complete your first code review

---

## 7. Trophy Case / Badges

### Badge Display Grid
```
┌─────────────────────────────────────────────────┐
│ Trophy Case                 Share: [f] [🐦]    │
├─────────────────────────────────────────────────┤
│ ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐             │
│ │ 🏆  │  │ 🏆  │  │ 🏆  │  │ 🏆  │             │
│ │ 5K  │  │ 5K  │  │ 5K  │  │ 5K  │             │
│ └─────┘  └─────┘  └─────┘  └─────┘             │
│ Feb 5K   Oct 5K   Sept 5K  Aug 5K              │
│ Feb 2025 Oct 2023 Sep 2023 Aug 2023            │
└─────────────────────────────────────────────────┘
```

### Badge Anatomy
- **Icon:** Colorful, visually distinct
- **Name:** Challenge/achievement name
- **Date:** When earned
- **Sponsor:** Partner branding (if applicable)

### Sharing
- Social media share buttons
- Shareable trophy case URL

---

## 8. Activity Feed Cards

### Activity Card Components
```
┌─────────────────────────────────────────────────┐
│ 👤 David East                              •••  │
│ 28 January 2026 at 19:09 · COROS PACE 3         │
├─────────────────────────────────────────────────┤
│ 🏃 Easy tread. 4x shoe change edition           │
│                                                 │
│ I literally changed shoes 4 times...            │
│                                                 │
│ 148 Training Load                               │
├─────────────────────────────────────────────────┤
│ Distance     Pace        Time                   │
│ 18.13 km     5:16 /km    1h 35m                │
├─────────────────────────────────────────────────┤
│ 👍 10 kudos                      💬 Comments    │
└─────────────────────────────────────────────────┘
```

### Stats by Activity Type
| Activity | Stats Shown |
|----------|-------------|
| Run | Distance, Pace, Time, Elev Gain |
| Ride | Distance, Elev Gain, Time, Avg Power |
| Walk | Distance, Steps, Time |
| Workout | Time, Calories, Avg HR |

### Achievements on Cards
- Inline achievement badges (PR, Local Legend)
- Segment records highlighted
- "This was X's best effort for Y!"

### Social Actions
- **Kudos** (👍) - One-tap appreciation
- **Comments** - Text responses
- **Share** - Social media sharing

---

## 9. Streaks

### Streak Display (Dashboard)
```
Your streak
    2
  Weeks
```

### Streak Mechanics
- Tracks consecutive periods of activity
- Displayed prominently on dashboard
- "Log an activity... to maintain your streak"

### Code Heroes Application
```
🔥 5 day streak | Best: 12 days
```
- Show current streak prominently
- Display personal best streak
- Celebrate when at/above best
- Encouraging message when broken

---

## 10. Recommended Features for Code Heroes

### Priority 1: Quick Wins
| Feature | Issue | Complexity |
|---------|-------|------------|
| Time Period Switching | #228 | Medium |
| Streak Counter | #230 | Medium |

### Priority 2: High Impact
| Feature | Issue | Complexity |
|---------|-------|------------|
| Rich Activity Cards | #231 | Medium |
| Personal Records | #232 | High |

### Priority 3: Major Feature
| Feature | Issue | Complexity |
|---------|-------|------------|
| Social Reactions (Fire) | #229 | High |

### Future Considerations
- Challenges system (team competitions)
- Trophy case page
- Activity year chart
- Goals with deadlines
- Activity type filtering

---

## Appendix: Screenshots Reference

Screenshots were captured during analysis session. Key pages analyzed:
1. Dashboard / Activity Feed
2. User Profile (Overview)
3. Training Log
4. My Goals
5. Challenges
6. Trophy Case

---

## Related Resources

- [Strava Features](https://www.strava.com/features)
- [Strava Mobile App](https://www.strava.com/mobile)
- GitHub Issues: #228, #229, #230, #231, #232
