# Admin Portal

Beheerportaal voor Code Heroes, gebouwd met Angular 21 en Stride UI.

## Architectuur

### Angular Setup

- **Angular 21** standalone-component applicatie (geen NgModules)
- Bootstrapping via `bootstrapApplication()` met `ApplicationConfig`
- Zone change detection met `eventCoalescing: true`
- Alle pagina-componenten zijn **lazy-loaded** via `loadComponent()`

### Routing

```
/login                → LoginComponent        (publiek)
/                     → ShellComponent         (beschermd door authGuard)
  ├── /home           → HomeComponent          (dashboard)
  ├── /projects       → ProjectsComponent
  ├── /users          → UsersComponent
  └── (default)       → redirect naar /home
```

`ShellComponent` fungeert als layout-wrapper met sidebar (navigatie, user-info, sign-out) en `<router-outlet>`.

### Authenticatie

- **Firebase Authentication** met Google OAuth (popup-flow)
- `AuthService` beheert state via Angular **Signals** (`currentUser`, `isAuthenticated`, `isLoading`)
- Functionele `authGuard` (CanActivateFn) beschermt routes onder `/`
- Firebase Auth Emulator (port 9099) wordt gebruikt wanneer `environment.useEmulators === true`

### Backend Interactie

REST calls naar een Express API (Cloud Function):

| Environment | API URL |
|---|---|
| Local | `http://localhost:5001/codeheroes-test/europe-west1/api` |
| Test/Prod | `https://europe-west1-codeheroes-test.cloudfunctions.net/api` |

Patroon in elke service:
1. Firebase ID token ophalen via `AuthService.getIdToken()`
2. Promise → Observable via `from()` + `switchMap()`
3. HTTP request met `Authorization: Bearer {token}` header

Types (`UserDto`, `ProjectSummaryDto`, `PaginatedResponse<T>`) komen uit `@codeheroes/types`.

### Projectstructuur

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
│   ├── login/login.component.ts
│   ├── projects/projects.component.ts
│   └── users/users.component.ts
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

## Stride UI Implementatie

### Dependencies

```
@move4mobile/stride-ui     ^1.17.0
@move4mobile/theme-framna  ^0.3.12
quill                      ^2.0.3   (peer dep van stride-ui)
```

### Setup stappen

**1. Font assets configureren** in `project.json`:

```json
{
  "glob": "**/*",
  "input": "node_modules/@move4mobile/theme-framna/assets/fonts",
  "output": "/assets/fonts"
}
```

**2. Theme initialiseren** in `styles.scss`:

```scss
@use 'tailwindcss';
@use '@move4mobile/theme-framna/theme';
@use '@move4mobile/stride-ui/sass/reset';

@include theme.init();
```

**3. Components importeren** (standalone):

```typescript
import { SuiButtonComponent } from '@move4mobile/stride-ui';

@Component({
  standalone: true,
  imports: [SuiButtonComponent],
  template: `<sui-button variant="outline" color="neutral" size="sm">Click</sui-button>`
})
```

### Lessons Learned

1. **`theme.init()` moet op top-level** — De mixin genereert CSS op `body {}`. Aanroepen binnen `:root {}` of een andere selector werkt niet.

2. **CSS variable naamgeving** wijkt af van verwachting:
   - Background: `--theme-color-bg-surface-default`, `bg-neutral-secondary`, `bg-brand-default`
   - Text: `--theme-color-text-default`, `text-neutral-secondary`, `text-neutral-tertiary`
   - Border: `--theme-color-border-default-default` (dubbel "default")
   - Feedback: `--theme-color-feedback-bg-error-secondary`, `feedback-border-error-default`
   - Font: `--theme-font-family-default`
   - Shadow: `--theme-effect-styles-drop-shadow-200`

3. **Font-kopie is vereist** — Zonder de assets-config in `project.json` valt de UI terug op system fonts.

4. **Quill als peer dependency** — Ondanks "optional" markering geeft npm warnings zonder. Installeer het altijd mee.

5. **Standalone imports, geen modules** — Gebruik `SuiButtonComponent` (niet `SuiButtonModule`) voor Angular 21+ standalone components.

## Development

```bash
# Serve lokaal (met emulators)
npx nx serve admin-portal

# Build
npx nx build admin-portal

# Production build
npx nx build admin-portal --configuration=production
```

Dev server draait op **port 4202**.
