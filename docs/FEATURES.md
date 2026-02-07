# Features Overzicht CodeHeroes App

Dit document beschrijft alle schermen en functionaliteiten van de CodeHeroes applicatie.

## Overzicht

CodeHeroes is een gamificatie platform voor developers dat GitHub en Azure DevOps activiteiten volgt en beloont met XP (Experience Points), levels en badges. De applicatie bestaat uit twee delen:
- **Main PWA App**: Voor eindgebruikers om hun voortgang te bekijken
- **Admin Portal**: Voor beheerders om het platform te beheren

---

## 📱 Main PWA App (Progressive Web App)

De CodeHeroes PWA is een mobile-first applicatie met een cyberpunk/neon thema en vier hoofdschermen, toegankelijk via een bottom navigation bar.

### Schermen

#### 1. 🏠 HQ (Headquarters) - Dashboard
**Route**: `/hq` (default homepage)

Het centrale dashboard waar users hun dagelijkse voortgang en prestaties kunnen volgen.

**Functionaliteiten**:
- **Dagelijkse Voortgang (Daily Progress)**
  - Toon aantal activiteiten van vandaag
  - Toon totaal XP verdiend vandaag
  - Voortgangsindicator voor dagelijkse doelen
  
- **Wekelijkse Statistieken (Weekly Stats)**
  - Totaal aantal commits deze week
  - Aantal Pull Requests gemaakt
  - Aantal Code Reviews uitgevoerd
  - Totaal XP verdiend deze week
  
- **Leaderboard Preview**
  - Top 5 spelers van de week
  - Huidige positie van de ingelogde gebruiker
  - Rank indicator (positie in de ranking)
  - Click-through naar volledige leaderboard modal
  
- **Recent Highlights**
  - Overzicht van recente prestaties
  - Belangrijke activiteiten van vandaag/deze week
  - Badge awards en level ups

**Componenten**:
- `DailyProgressComponent`
- `WeeklyStatsComponent`
- `LeaderboardPreviewComponent`
- `LeaderboardModalComponent` (full-screen overlay)
- `HighlightsComponent`

---

#### 2. ⚡ Activity Wall - Activiteitenoverzicht
**Route**: `/activity`

Een real-time feed van alle activiteiten van alle gebruikers in het systeem.

**Functionaliteiten**:
- **Activity Feed**
  - Chronologische stream van alle activiteiten
  - Automatisch groeperen van gerelateerde activiteiten (activity stacking)
  - Real-time updates via Firebase subscriptions
  - Support voor 100+ activities
  
- **Activity Types**
  - **Code Activiteiten**: Pushes, branch creatie/verwijdering, tags
  - **Pull Request Activiteiten**: PR creatie, updates, merges
  - **Issue Activiteiten**: Issue creatie, updates, sluiting, heropening
  - **Review Activiteiten**: PR reviews, comments, thread resoluties
  - **Deployment Activiteiten**: Deployments
  
- **Activity Cards**
  - User avatar met indicator
  - Activity beschrijving
  - Repository naam
  - XP beloning
  - Timestamp
  - Activity type indicator met kleurcode
  
- **Activity Stacking**
  - Groeperen van meerdere activiteiten van dezelfde user
  - Expandable/collapsable stacks
  - Timeline visualisatie binnen stacks
  
- **Debug Panel** (Developer feature)
  - Toggle met 'D' toets
  - Toon ruwe activity data
  - Inspecteer activity details
  - Debugging informatie voor development

**Componenten**:
- `ActivityItemComponent` - Individuele activiteit weergave
- `ActivityStackComponent` - Gegroepeerde activiteiten
- `StackTimelineComponent` - Timeline binnen een stack
- `DebugPanelComponent` - Debug informatie overlay

---

#### 3. 🔍 Search - Gebruikers Zoeken
**Route**: `/search`

Zoek en browse functie om andere CodeHeroes te vinden.

**Functionaliteiten**:
- **Zoek Functie**
  - Real-time search met debouncing (300ms)
  - Zoek op displayName
  - Type-ahead suggesties
  
- **Gebruikerslijst**
  - Browse alle geregistreerde gebruikers
  - Standaard weergave van eerste 20 gebruikers
  - Avatar weergave (of initialen bij ontbreken)
  - Displaynaam
  
- **Navigatie**
  - Click-through naar user profile
  - Direct navigeren naar `/users/:id`
  
- **Search States**
  - Loading state tijdens zoeken
  - Empty state wanneer geen resultaten
  - Standaard browse mode zonder zoekterm

**Features**:
- Responsive layout
- Keyboard-friendly search input
- Touch-optimized cards voor mobile

---

#### 4. 👤 Profile - Gebruikersprofiel
**Route**: `/profile`

Persoonlijk profiel van de ingelogde gebruiker met volledige statistieken en beheeropties.

**Functionaliteiten**:
- **Profiel Header**
  - Avatar weergave
  - Display naam met inline edit knop
  - Huidige level
  - Member since datum (wanneer account aangemaakt)
  - Logout knop
  
- **Display Name Bewerken**
  - Modal dialog voor naam wijzigen
  - Real-time validatie
  - Error handling
  - Direct update in UI en cache
  
- **XP Progress Bar**
  - Visuele voortgangsbalk naar volgend level
  - Huidige XP / Vereiste XP weergave
  - Percentage berekening
  
- **Stats Grid**
  - Total XP (lifetime)
  - Activity Count (totaal aantal activiteiten)
  - Streaks (opeenvolgende dagen actief)
  - Other game statistics
  
- **Weekly Trends (My Stats)**
  - Grafische weergave van wekelijkse voortgang
  - Laatste 4 weken geschiedenis
  - XP per week
  - Activity counts per week
  
- **Badges Sectie**
  - Grid weergave van verdiende badges
  - Badge emoji/icon
  - Badge naam
  - Earned date
  - XP waarde (indien van toepassing)
  - Rarity indicator (Common, Uncommon, Rare, Epic, Legendary)
  - Kleurgecodeerde borders op basis van rarity
  - "View All" knop voor volledige badge collectie
  
- **Badge Modal**
  - Full-screen overlay met alle badges
  - Scrollable grid
  - Filtering en sorting opties
  
- **Recent Activity**
  - Meest recente activiteit van de gebruiker
  - Zelfde weergave als Activity Wall
  - Beperkt tot 1 item (voor security)

**Badge Categories**:
- **Level Badges**: Verdiend bij bepaalde levels (Novice Coder → Code Architect)
- **Milestone Badges**: Voor specifieke achievements (First Push, First PR, etc.)
- **Special Badges**: Bijzondere prestaties

**Badge Rarity System**:
- Common (grijs)
- Uncommon (groen)
- Rare (cyaan)
- Epic (paars)
- Legendary (oranje)

**Componenten**:
- `ProfileAvatarComponent`
- `XpProgressComponent`
- `StatsGridComponent`
- `BadgesGridComponent`
- `BadgesModalComponent`
- `MyStatsComponent`
- `ProfileEditModalComponent`
- `ActivityItemComponent`

---

#### 5. 👥 User Profile - Andere Gebruiker Bekijken
**Route**: `/users/:id`

Publiek profiel van een andere gebruiker (toegankelijk via Search).

**Functionaliteiten**:
- Vergelijkbaar met eigen Profile, maar read-only
- Geen edit functionaliteit
- Geen logout knop
- Back-navigatie naar Search
- Beperkte activity weergave (max 1 item voor privacy/security)
- Alle statistieken en badges zijn zichtbaar
- Wekelijkse trends zichtbaar

**Privacy/Security**:
- Zeer beperkte activity history (max 1 recent item)
- Alleen publieke informatie zichtbaar
- Geen toegang tot persoonlijke data

---

### 🎨 Layout & Navigation

#### Bottom Navigation Bar
Vast navigatie element onderaan het scherm met 4 knoppen:
- **HQ** (Home icon) - Dashboard
- **ACTIVITY** (Lightning icon) - Activity Feed
- **SEARCH** (Search icon) - Gebruikers zoeken
- **PROFILE** (User icon) - Eigen profiel

**Features**:
- Active state indicator met neon cyaan glow
- Touch-optimized (44px minimum tap targets)
- Safe area insets voor moderne smartphones
- Sticky positioning
- Backdrop blur effect
- Cyberpunk styling met purple border glow

#### Shell Component
- Omhullende layout component
- Integreert bottom navigation
- Environment banner voor development/staging
- Responsive design

#### Environment Banner
- Toont huidige environment (local/dev/staging)
- Alleen zichtbaar in non-productie omgevingen
- Waarschuwingskleur codering

---

### 🎮 Gamification Features

#### XP (Experience Points) Systeem
- XP verdiend voor alle activiteiten
- Variabele XP op basis van activity type en complexiteit
- XP breakdown zichtbaar per activiteit
- Cumulatief XP tracking

#### Level Systeem
- Progressive leveling (Level 1 → Level 20+)
- Exponentieel stijgende XP requirements
- Level badges bij bepaalde milestones
- Level indicator overal zichtbaar

#### Badge Systeem
- **Verdiend via**:
  - Level milestones
  - Activity milestones (1e, 10e, 50e, 100e actie)
  - Specifieke achievements (First Push, First PR, etc.)
  - Special events
  
- **Badge Properties**:
  - Unieke ID en naam
  - Emoji icon
  - Beschrijving
  - Rarity level
  - Category (level/milestone/special)
  - XP bonus (optioneel)
  - Earned timestamp

#### Leaderboard Systeem
- Wekelijkse ranking
- Global leaderboard van alle gebruikers
- XP-based ranking
- User's eigen positie gemarkeerd
- Top performers highlighted
- Reset mechanisme per week

#### Activity Stacking
- Intelligente groepering van gerelateerde activiteiten
- Binnen 2 uur van elkaar
- Zelfde gebruiker
- Optioneel: zelfde repository
- Verbetert overzichtelijkheid in feed

---

### 🔐 Authentication

**Firebase Authentication**:
- Email/Password login
- Social auth providers (configureerbaar)
- Persistent sessions
- Automatic token refresh
- Logout functionaliteit
- Auth guards voor protected routes

---

### 📊 Data & Services

#### Core Services
- `ActivityFeedService` - Activity stream management
- `UserStatsService` - User statistics en profiles
- `UserCacheService` - In-memory user data caching
- `HqDataService` - Dashboard data aggregatie
- `UserSearchService` - User search en browsing
- `ActivityStackerService` - Activity grouping logic

#### Real-time Updates
- Firebase Firestore subscriptions
- Real-time activity feed
- Live leaderboard updates
- Instant stats updates

#### Performance Optimizations
- User data caching
- Lazy loading routes
- Optimistic UI updates
- Debounced search
- Pagination support

---

## 🔧 Admin Portal

Aparte Angular applicatie voor platform administratie.

**Route**: Apart domein/subdomain

### Schermen

#### 1. Login
**Route**: `/login`

Authenticatie voor beheerders.

---

#### 2. Home - Dashboard
**Route**: `/home`

Admin dashboard met platform overzicht en statistieken.

---

#### 3. Projects - Project Beheer
**Route**: `/projects`

**Functionaliteiten**:
- Lijst van alle geregistreerde projects/repositories
- Project details (naam, URL, settings)
- Project aanmaken
- Project bewerken (Edit Project Modal)
- Project verwijderen
- Project configuration
- Webhook configuratie

**Componenten**:
- `ProjectCardComponent`
- `EditProjectModalComponent`

---

#### 4. Users - Gebruikersbeheer
**Route**: `/users`

**Functionaliteiten**:
- Overzicht van alle gebruikers
- User details
- User statistieken
- Gebruikersbeheer acties
- Account status management

---

#### 5. Leaderboard - Ranking Beheer
**Route**: `/leaderboard`

**Functionaliteities**:
- Full leaderboard weergave
- Ranking details
- Periode selectie
- Data export mogelijkheden
- Manual adjustments (indien nodig)

---

### Admin Features

- **Authentication Guard**: Alleen toegang voor geautoriseerde admins
- **Shell Layout**: Consistent admin interface
- **Navigation**: Sidebar of top navigation
- **Data Management**: CRUD operations voor platform data
- **Analytics**: Platform usage metrics
- **Configuration**: System settings en parameters

---

## 🎯 Activity Types & Categorieën

### Categorieën

1. **CODE** - Code gerelateerde activiteiten
   - `CODE_PUSH` - Code push naar repository
   - `CODE_COVERAGE` - Code coverage reports
   - `BRANCH_CREATED` - Nieuwe branch aangemaakt
   - `BRANCH_DELETED` - Branch verwijderd
   - `TAG_CREATED` - Tag/release aangemaakt
   - `TAG_DELETED` - Tag verwijderd

2. **PULL_REQUEST** - Pull Request activiteiten
   - `PR_CREATED` - Nieuwe PR aangemaakt
   - `PR_UPDATED` - PR geüpdatet
   - `PR_MERGED` - PR gemerged

3. **ISSUE** - Issue tracking
   - `ISSUE_CREATED` - Issue aangemaakt
   - `ISSUE_CLOSED` - Issue gesloten
   - `ISSUE_UPDATED` - Issue geüpdatet
   - `ISSUE_REOPENED` - Issue heropend

4. **REVIEW** - Code review activiteiten
   - `PR_REVIEW` - Review uitgevoerd
   - `PR_REVIEW_SUBMITTED` - Review ingediend
   - `PR_REVIEW_UPDATED` - Review aangepast
   - `PR_REVIEW_DISMISSED` - Review dismissed
   - `PR_REVIEW_THREAD_RESOLVED` - Review thread opgelost
   - `PR_REVIEW_THREAD_UNRESOLVED` - Review thread heropend
   - `PR_REVIEW_COMMENT_CREATED` - Review comment toegevoegd
   - `PR_REVIEW_COMMENT_UPDATED` - Review comment aangepast

5. **DEPLOYMENT** - Deployment activiteiten
   - `DEPLOYMENT` - Code deployed naar environment

---

## 🎨 Design System

### Kleurenpallet (Cyberpunk/Neon Theme)

- **Primary**: Neon Cyan (`--neon-cyan`, `#00f5ff`)
- **Secondary**: Neon Purple (`--neon-purple`, paars)
- **Accent**: Neon Green (`--neon-green`, groen)
- **Warning**: Neon Orange (`--neon-orange`, oranje)
- **Background**: Black met transparancy (`bg-black/90`)
- **Text**: White primary, Slate secondary
- **Borders**: Purple/Cyan glows

### Typography

- **Headers**: Bold, Italic styling
- **Data**: JetBrains Mono (monospace font)
- **Body**: System fonts (sans-serif)

### Effects

- **Glow Effects**: Box-shadow met neon kleuren
- **Backdrop Blur**: Glassmorphism effect
- **Transitions**: Smooth 0.2s ease
- **Hover States**: Color shifts en glow intensification

### Responsive Design

- **Mobile First**: Geoptimaliseerd voor smartphones
- **Breakpoints**:
  - Mobile: < 768px
  - Desktop: ≥ 768px (md:)
  - Large: ≥ 1024px (lg:)

### Accessibility

- **ARIA Labels**: Op alle interactieve elementen
- **Keyboard Navigation**: Volledige keyboard support
- **Focus States**: Duidelijke focus indicators
- **Semantic HTML**: Proper heading hierarchy
- **Screen Reader**: Friendly markup
- **Touch Targets**: Minimum 44x44px

---

## 🔌 Integraties

### GitHub
- Webhook receiver voor GitHub events
- Support voor alle standaard GitHub events
- Automatic activity parsing en XP calculation

### Azure DevOps
- Webhook receiver voor Azure DevOps events
- Support voor:
  - Git Push events
  - Pull Request events (created, merged)
  - Repository events

### Firebase
- **Firestore**: Database voor alle app data
- **Authentication**: User authentication
- **Functions**: Backend logic (API, Game Engine, Receivers)
- **Hosting**: PWA deployment
- **Emulator Suite**: Local development environment

---

## 📱 Progressive Web App Features

- **Installable**: Add to Home Screen
- **Offline Capable**: Service Worker caching
- **Responsive**: Works on all screen sizes
- **Fast**: Optimized loading en performance
- **Engaging**: Push notifications (configureerbaar)
- **App-like**: Native app ervaring

---

## 🛠️ Technical Stack

### Frontend (PWA)
- **Framework**: Angular 18+ (Standalone Components)
- **Routing**: Angular Router met lazy loading
- **State**: Signals (Angular's reactive primitives)
- **Styling**: Tailwind CSS
- **HTTP**: AngularFire (Firebase SDK)

### Frontend (Admin Portal)
- **Framework**: Angular 18+
- **Same tech stack**: Als PWA

### Backend
- **Platform**: Firebase Functions (Node.js)
- **Database**: Cloud Firestore
- **Auth**: Firebase Authentication
- **Architecture**: Event-driven, serverless

### Development
- **Monorepo**: Nx workspace
- **Package Manager**: npm
- **Version Control**: Git/GitHub
- **CI/CD**: GitHub Actions (optioneel)

---

## 📚 Documentatie Structuur

De documentatie is georganiseerd in verschillende categorieën:

- **`/docs/architecture`**: Architectuur documentatie
  - System overview
  - Activity stream architectuur
  - Badge system design
  
- **`/docs/concepts`**: Gaming concepten en design philosophy

- **`/docs/design`**: UI/UX design documentatie
  - Previous designs
  - Design systems
  
- **`/docs/plans`**: Feature planning documents
  - Badge system MVP
  - Level system fixes
  
- **`/docs/contributing`**: Contributing guidelines
  - GitHub labels
  
- **`/docs/research`**: Research en inspiratie
  - UX analyses (bijv. Strava)
  
- **`/docs/inspiration`**: Design inspiratie
  - Gaming concepts
  - Character systems

---

## 🚀 Key Features Samenvatting

### Voor Gebruikers
1. ✅ Real-time activity tracking
2. ✅ XP en level progression
3. ✅ Badge collection system
4. ✅ Wekelijkse leaderboard competitie
5. ✅ Profiel personalisatie
6. ✅ Social features (zoeken, profiles bekijken)
7. ✅ Dagelijkse en wekelijkse statistieken
8. ✅ Activity feed met stacking
9. ✅ Responsive mobile-first design
10. ✅ PWA installatie

### Voor Beheerders
1. ✅ Project management
2. ✅ User management
3. ✅ Leaderboard oversight
4. ✅ Platform analytics
5. ✅ Configuration management

### Technisch
1. ✅ Event-driven architectuur
2. ✅ Real-time updates
3. ✅ Scalable Firebase backend
4. ✅ Multi-platform support (GitHub, Azure DevOps)
5. ✅ Secure authentication
6. ✅ Performance optimizations
7. ✅ Developer-friendly debugging tools

---

## 📅 Versie Informatie

**Laatste Update**: 2026-02-07  
**Documentatie Versie**: 1.0  
**App Versie**: Zie `package.json` in repository

---

## 🔗 Gerelateerde Documentatie

- [README.md](../README.md) - Project overzicht en setup instructies
- [Architecture Overview](architecture/overview.md) - Technische architectuur
- [Badge System](architecture/badge-system.md) - Badge systeem details
- [Activity Stream](architecture/activity-stream.md) - Activity processing
