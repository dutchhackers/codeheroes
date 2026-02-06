# Admin Portal

Admin dashboard for Code Heroes, built with Angular 21 and Stride UI.

## Architecture

### Angular Setup

- **Angular 21** standalone-component application (no NgModules)
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

| Environment | API URL |
|---|---|
| Local | `http://localhost:5001/codeheroes-test/europe-west1/api` |
| Test/Prod | `https://europe-west1-codeheroes-test.cloudfunctions.net/api` |

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
@move4mobile/stride-ui     ^1.17.0
@move4mobile/theme-framna  ^0.3.12
quill                      ^2.0.3   (peer dep of stride-ui)
```

### Setup Steps

**1. Configure font assets** in `project.json`:

```json
{
  "glob": "**/*",
  "input": "node_modules/@move4mobile/theme-framna/assets/fonts",
  "output": "/assets/fonts"
}
```

**2. Initialize theme** in `styles.scss`:

```scss
@use 'tailwindcss';
@use '@move4mobile/theme-framna/theme';
@use '@move4mobile/stride-ui/sass/reset';

@include theme.init();
```

**3. Import components** (standalone):

```typescript
import { SuiButtonComponent } from '@move4mobile/stride-ui';

@Component({
  standalone: true,
  imports: [SuiButtonComponent],
  template: `<sui-button variant="outline" color="neutral" size="sm">Click</sui-button>`
})
```

### Lessons Learned

1. **`theme.init()` must be called at top level** — The mixin generates CSS on `body {}`. Calling it inside `:root {}` or any other selector produces nested output and doesn't work.

2. **CSS variable naming** differs from what you might expect:
   - Background: `--theme-color-bg-surface-default`, `bg-neutral-secondary`, `bg-brand-default`
   - Text: `--theme-color-text-default`, `text-neutral-secondary`, `text-neutral-tertiary`
   - Border: `--theme-color-border-default-default` (double "default")
   - Feedback: `--theme-color-feedback-bg-error-secondary`, `feedback-border-error-default`
   - Font: `--theme-font-family-default`
   - Shadow: `--theme-effect-styles-drop-shadow-200`

3. **Font copy is required** — Without the assets config in `project.json`, the UI falls back to system fonts.

4. **Quill as peer dependency** — Despite being marked "optional", npm produces warnings without it. Always install it.

5. **Standalone imports, not modules** — Use `SuiButtonComponent` (not `SuiButtonModule`) for Angular 21+ standalone components.

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
