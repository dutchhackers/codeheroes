# Admin Portal

Admin dashboard for Code Heroes, built with Angular 22 and Stride UI.

## Architecture

### Angular Setup

- **Angular 22** standalone-component application (no NgModules)
- Bootstrapping via `bootstrapApplication()` with `ApplicationConfig`
- Zone change detection with `eventCoalescing: true`
- All page components are **lazy-loaded** via `loadComponent()`

### Routing

```
/login                → LoginComponent        (public)
/                     → ShellComponent         (protected by authGuard)
  ├── /home           → HomeComponent          (dashboard)
  ├── /projects       → ProjectsComponent
  ├── /users          → UsersComponent
  ├── /leaderboard    → LeaderboardComponent   (not in sidebar)
  └── (default)       → redirect to /home
```

`ShellComponent` serves as the layout wrapper with a sidebar (navigation, user info, sign-out) and a `<router-outlet>`.

### Authentication

- **Firebase Authentication** with Google OAuth (popup flow)
- `AuthService` manages state via Angular **Signals** (`currentUser`, `isAuthenticated`, `isLoading`)
- Functional `authGuard` (CanActivateFn) protects all routes under `/`
- Firebase Auth Emulator (port 9099) is used when `environment.useEmulators === true`

### Backend Interaction

REST calls to an Express API (Cloud Function):

| Environment | API URL                                                       |
| ----------- | ------------------------------------------------------------- |
| Local       | `http://localhost:5001/codeheroes-test/europe-west1/api`      |
| Test/Prod   | `https://europe-west1-codeheroes-test.cloudfunctions.net/api` |

Pattern used in every service:

1. Fetch Firebase ID token via `AuthService.getIdToken()`
2. Convert Promise to Observable via `from()` + `switchMap()`
3. Execute HTTP request with `Authorization: Bearer {token}` header

Types (`UserDto`, `ProjectSummaryDto`, `PaginatedResponse<T>`) are imported from `@codeheroes/types`.

### Project Structure

```
src/app/
├── core/
│   ├── guards/auth.guard.ts
│   └── services/
│       ├── auth.service.ts
│       ├── dashboard.service.ts
│       ├── projects.service.ts
│       └── users.service.ts
├── layout/shell.component.ts
├── pages/
│   ├── home/home.component.ts
│   ├── leaderboard/leaderboard.component.ts
│   ├── login/login.component.ts
│   ├── projects/projects.component.ts
│   └── users/users.component.ts
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

## Stride UI Integration

### Dependencies

```
@stride-ui/components     ^2.14.0
@stride-ui/theme-framna   ^0.7.0
quill                     ^2.0.3   (optional peer, only for sui-rich-text-input)
```

Both packages come from GitHub Packages (`@stride-ui` scope, see `.npmrc`). The components need
Angular 22. `node_modules/@stride-ui/components/skill.md` documents every component and its inputs.

### Setup Steps

**1. Add the theme tokens and the assets** in `project.json`:

```json
"assets": [
  { "glob": "**/*", "input": "node_modules/@stride-ui/components/assets", "output": "/assets" },
  { "glob": "**/*", "input": "node_modules/@stride-ui/theme-framna/assets", "output": "/assets" }
],
"styles": [
  "apps/frontend/admin-portal/src/styles.scss",
  "node_modules/@stride-ui/theme-framna/components/css/tokens.css"
]
```

`tokens.css` defines the design tokens as CSS variables on `:root` and declares the Framna fonts,
which it loads from `/assets/fonts`. The icons of `sui-icon` are fetched from `/assets/icons`.

**2. Load the component styles** in `styles.scss`:

```scss
@use 'tailwindcss';
@use '@stride-ui/components/sass/prebuilt';
@use '@stride-ui/components/sass/reset';
@use '@angular/cdk/overlay-prebuilt.css';
```

**3. Import components** (standalone):

```typescript
import { SuiButtonComponent } from '@stride-ui/components';

@Component({
  imports: [SuiButtonComponent],
  template: `<sui-button variant="outline" color="neutral" size="sm">Click</sui-button>`
})
```

### Lessons Learned

1. **Token names have no prefix** (they were `--theme-*` up to theme 0.3):
   - Background: `--color-bg-surface-default`, `--color-bg-neutral-secondary`, `--color-bg-brand-default`
   - Text: `--color-text-default`, `--color-text-neutral-secondary`, `--color-text-neutral-tertiary`
   - Border: `--color-border-default-default` (double "default")
   - Feedback: `--color-feedback-bg-error-secondary`, `--color-feedback-border-error-default`
   - Font: `--font-family-default`
   - Shadow: `--effect-styles-drop-shadow-200`

2. **Dark mode is an attribute** — the tokens switch on `data-color-mode="dark"`. `ThemeService` sets it on `<html>` and keeps the `dark-mode` class on `<body>` for the portal's own styles; `index.html` does the same before Angular starts, so there is no flash.

3. **The asset copy is required** — without it the UI falls back to system fonts and `sui-icon` shows nothing.

4. **`provideHttpClient()` is required** — `sui-icon` loads its SVGs over HTTP.

## Development

```bash
# Serve locally (with emulators)
npx nx serve admin-portal

# Build
npx nx build admin-portal

# Production build
npx nx build admin-portal --configuration=production
```

Dev server runs on **port 4202**.
