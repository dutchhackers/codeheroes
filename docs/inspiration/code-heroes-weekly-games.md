# Code Heroes Weekly Team Competitions: Hero Points vs. XP System

## Overview

The Weekly Team Competition is a core social feature of Code Heroes that encourages friendly competition, team collaboration, and consistent engagement. By grouping users into balanced superhero-themed teams each week, the system creates a dynamic competitive environment that refreshes regularly, giving all participants multiple opportunities to win regardless of individual contribution levels.

## Competition Structure

### Timing and Format
- **Game Duration**: Monday 8:00 AM to Friday 4:00 PM each week
- **Competition Type**: Team-based point accumulation
- **Reset Cycle**: Weekly, with new games starting automatically
- **Team Count**: Four competing teams (fixed)

### Teams
- **Team Names**:
  - Suicide Squad
  - Justice League
  - X-Men
  - The Avengers
- **Team Formation**: Users are randomly assigned to a team upon their first activity of the week
- **Team Balance**: Assignment algorithm ensures no team has more than one additional member than others

### Leadership Roles
- **Team Captains**: The first user to join each team becomes that week's "Team Captain"
- **Captain Succession**: At the end of each game, the highest point-earners from each team become the captains for the following week
- **Captain Recognition**: Captains receive special indicators on their profiles and leaderboards

### Hero Points (HP) System
- **Hero Point Sources**: All standard game action types award HP for the individual and their team
  - Code pushes (2-3 HP)
  - Pull request creation (3 HP)
  - Pull request reviews (2 HP)
  - Merge activities (2 HP)
  - Other tracked development actions (1-5 HP based on complexity)
- **Team Score**: Cumulative total of all team members' HP earned during the game period
- **Visibility**: Live leaderboards show team standings and individual HP contributions
- **Timeframe Limitation**: HP can only be earned during office hours (Mon-Fri, 8:00-16:00)
- **Weekly Reset**: All HP counters reset at the start of each new weekly competition

## Hero Points vs. XP: Dual Reward System

Code Heroes implements two distinct but complementary reward systems:

### Hero Points (HP)
- **Temporary Competition Metric**: HP are only valid during the current weekly game
- **Team-Based**: All HP contribute to team standings
- **Time-Bounded**: Only earned during office hours (Mon-Fri, 8:00-16:00)
- **Social Focus**: Designed to encourage team collaboration during work hours
- **Weekly Reset**: HP reset completely at the start of each new game
- **Work-Life Balance**: Intentionally ends at 16:00 on Friday to transition to team social time

### Experience Points (XP)
- **Permanent Progression Metric**: XP accumulates over a user's entire journey
- **Individual Growth**: Tracks personal development and skill progression
- **Always Available**: Can be earned at any time, including evenings and weekends
- **Long-Term Focus**: Drives continuous improvement and learning
- **Never Resets**: XP is persistently maintained on a user's profile
- **Flexible Work Styles**: Accommodates developers who prefer working outside standard hours

### Example Interaction
When a developer creates a pull request:
- They immediately earn 100 XP toward their permanent level progression
- During active game hours, they also earn 3 HP toward their team's weekly score
- The XP remains on their profile indefinitely
- The HP contribute to that week's competition and then reset for the next game

## Design Philosophy

The Weekly Team Competition was designed with several key gamification principles:

1. **Social Cushioning**: Team-based competition reduces individual performance pressure and creates a sense of belonging
2. **Fresh Starts**: Weekly resets ensure no team falls permanently behind
3. **Multiple Victory Paths**: Users can contribute to team success even without being top performers
4. **Work-Life Balance**: Limiting HP to office hours discourages overwork and "saving" contributions
5. **Thematic Connection**: Hero Points reinforce the superhero theme of Code Heroes
6. **Balanced Competition**: Team size equalization ensures fair competition
7. **Community Building**: Friday afternoon end time encourages team celebration

## Reward System

### Team Rewards
- **Victory Banner**: Digital team banner displayed on all winning team members' profiles for the week
- **Team Trophy**: Digital trophy in team colors displayed in achievement collection
- **XP Bonuses**: 15% bonus XP for all winning team members for the first day of the next week
- **Team Spotlight**: Featured placement on the Code Heroes dashboard for the winning team
- **HP Recognition**: Total HP earned displayed on team profile as historical record

### Individual Rewards
- **Captain's Insignia**: Special profile badge for team captains
- **MVP Recognition**: Highest point-earner on each team receives "Team MVP" badge for the week
- **Contribution Tiers**: Recognition levels based on point contribution percentage to team total
  - Hero (Top 10%)
  - Defender (Top 25%)
  - Guardian (Top 50%)
  - Ally (All contributors)

### Streak Rewards
- **Personal Victory Streaks**: Achievements for consecutive weeks on winning teams
  - "2-Week Champion"
  - "3-Week Champion"
  - "5-Week Dynasty Member"
  - "10-Week Legend"
- **Captain Streaks**: Special recognition for consecutive weeks as captain
  - "Recurring Captain" (2 weeks)
  - "Captain's Command" (3 weeks)
  - "Born Leader" (5+ weeks)
- **Team Dynasty Recognition**: When the same team wins multiple weeks consecutively
  - Community-wide notification
  - Special team page highlighting the achievement
- **Comeback Bonus**: Extra 25% points for a team that wins after placing last the previous week

### Physical Reward Integration
For organizations with Framna Shop integration:
- **Team Victory Items**: Winning team members qualify for team-themed merchandise
- **Captain's Perks**: Multiple captain roles may qualify users for premium physical rewards
- **Streak Bonuses**: Consecutive wins could accumulate toward higher-tier physical rewards
- **Seasonal Champions**: Teams/individuals with most wins per quarter could receive special physical recognitions

## Implementation Considerations

- **Fair Team Assignment**: Algorithm must account for different team sizes and skill levels
- **Absence Handling**: Mechanism for handling users who join mid-week or are absent
- **Dashboard Integration**: Clear visualization of current game status, team standings, and individual contributions
- **History Tracking**: Archive of past games, winners, and notable achievements
- **Reward Distribution**: Automated system for tracking and distributing digital rewards
- **Dual Currency Tracking**: Clear distinction between HP and XP in all interfaces
- **Activity Timing Check**: System to verify activities occur during official game hours for HP
- **Visual Differentiation**: Distinct icons and colors for HP vs. XP in the interface

## Future Enhancements

- **Seasonal Themes**: Special themed competitions for holidays or company milestones
- **Cross-Discipline Integration**: Include designer and project manager activities in HP accumulation
- **Custom Team Creation**: Allow organizations to customize team names and themes
- **Handicap System**: Dynamic HP adjustment to balance teams with varying skill levels
- **Mission Objectives**: Special weekly team challenges beyond standard HP accumulation
- **HP Multipliers**: Special events or activities that temporarily increase HP earned
- **HP Visualization**: Enhanced team dashboards showing HP flow throughout the week
- **Critical Time Bonuses**: Extra HP for activities during key project milestones
- **Friday Finale Events**: Special high-HP opportunities in the final hours before 16:00

## Benefits of the HP/XP Dual System

The separation between Hero Points and XP creates several advantages:

1. **Work-Life Balance Protection**:
   - HP only accumulate during office hours
   - Creates a clear boundary that doesn't encourage after-hours work
   - Ends early on Friday to transition to team social time

2. **Behavior Modification**:
   - Prevents "hoarding" behavior where developers save commits for Monday morning
   - Encourages regular integration of work during business hours
   - Promotes more natural, continuous development practices

3. **Multiple Engagement Paths**:
   - Team HP: Social, time-limited competition focused on teamwork
   - Individual XP: Personal progression available 24/7 for flexible work styles

4. **Cultural Reinforcement**:
   - HP system ends at 16:00 on Friday, intentionally timed for social celebration
   - Creates a ritual that bridges digital competition with real-world team bonding

5. **Complementary Motivations**:
   - HP appeals to team-oriented, socially motivated players
   - XP appeals to achievement-oriented, progression-focused players
   - Together they provide comprehensive engagement

---

This weekly competition system creates a dynamic social layer to Code Heroes that encourages regular participation, fosters team identity, and provides multiple paths to recognition while maintaining a balanced competitive environment. The Hero Points system specifically addresses workplace collaboration during business hours, while the complementary XP system acknowledges and rewards overall developer growth regardless of when the work occurs.
