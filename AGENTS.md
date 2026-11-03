# Code Heroes: instructions for every agent

These rules apply to any coding agent working in this repository, whatever the vendor, and to
the `agent-build` factory in particular (`.github/workflows/agent-build.yml`).

## What this is

Code Heroes turns development activity into a game. Webhooks from GitHub, Azure DevOps and
Bitbucket are received, normalised into game actions, scored for XP, levels, badges and
achievements, and shown in a PWA and an admin portal. The backend runs on Firebase (Cloud
Functions, Firestore, Hosting).

## Layout

Nx 23 monorepo, TypeScript, Node 24 (`.nvmrc`). Import libraries through their path aliases
(`@codeheroes/<lib>`, see `tsconfig.base.json`), never through relative paths across projects.

**Apps** (`apps/`)

| Project                                                      | What it is                                                            |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| `api`                                                        | REST API (Express on Cloud Functions)                                 |
| `auth-service`                                               | Firebase Auth blocking triggers (before user created, before sign-in) |
| `game-engine`                                                | Turns game actions into XP, levels, badges                            |
| `github-receiver`, `azure-receiver`, `bitbucket-receiver`    | Webhook receivers, one per provider                                   |
| `github-simulator`, `azure-simulator`, `bitbucket-simulator` | CLIs that send test webhooks locally                                  |
| `firebase-app`                                               | Firebase project wrapper: rules, emulators, deploy targets            |
| `app` (`apps/frontend/app`)                                  | The player PWA, Angular 21                                            |
| `admin-portal` (`apps/frontend/admin-portal`)                | The admin UI, Angular 21                                              |

**Libraries** (`libs/`)

| Project                         | What it is                                             |
| ------------------------------- | ------------------------------------------------------ |
| `types`                         | Shared types, used by server and frontend              |
| `common`                        | Server core: repositories, Firestore access, utilities |
| `integrations`                  | Provider adapters: webhook payload → game action       |
| `activity`, `event`             | Activity and event processing                          |
| `progression-engine`            | XP and level rules                                     |
| `achievements`, `notifications` | Badges/achievements and notifications                  |
| `database-seeds`                | Seed data and tools for local development              |

Architecture notes live in `docs/architecture/`.

## Commands

Run everything from the repository root.

```sh
npm run setup                                    # generates .firebaserc and environment files; run once
npx nx test <project>                            # unit tests of one project (Jest)
npx nx lint <project>                            # lint one project (ESLint)
npx nx build <project>                           # build one project
npx nx affected -t test build --base=origin/main # what the factory runs to verify a change
```

`npx nx show projects --with-target test` lists the projects that have tests.

## Rules

- Build exactly what the issue asks. If it is unclear, contradictory or larger than one PR,
  stop and report status `blocked` with your questions instead of guessing.
- Every change comes with unit tests (`*.spec.ts`, next to the code or in the project's
  `__tests__/` folder, as the project already does). Never weaken, skip or delete an existing
  test to make a check pass.
- Follow the patterns already in the project you touch: repositories in `libs/server/common`
  for Firestore access, provider adapters in `libs/server/integrations`, standalone components
  and signals for new state in the Angular apps.
- Do not introduce new lint errors in the projects you change.
- No new dependencies without a reason in the PR summary. Never change a dependency's major
  version as a side effect.
- Conventional commits for PR titles: `feat:`, `fix:`, `refactor:`, `perf:`, `test:`, `docs:`,
  `chore:`, with the project as scope where it helps (`fix(api): ...`).
- Everything in the repository is English.

## Protected paths

These change through humans only. The factory refuses a patch that touches any of them.

- `.github/` (workflows, issue templates, CODEOWNERS)
- `.factory/` (the factory itself)
- `AGENTS.md` (this file)
- `.npmrc`, `.gitattributes`, `.gitmodules`, in any directory
- `firebase.json`, `*.rules` (Firestore and Storage security rules)
- `scripts/setup-firebase.js`
- What decides how tests run: `nx.json`, `.nxignore`, `jest.config.*`, `jest.preset.*`,
  `tsconfig.spec.json`, `test-setup.*`

The test contract is checked too (`.factory/guard.sh`), so a green check still means the
tests ran:

- the `scripts` in the root `package.json` stay as they are (dependencies may change);
- in `project.json` you may change build options, but not `name`, `tags`,
  `implicitDependencies`, the `test` and `lint` targets or the build executor, and you may
  not delete one;
- no test file is deleted, no `.skip`, `.only`, `xit`, `fit` or similar is added, and the
  number of test cases does not go down.

`run_verify` runs the same guard, so you see a refusal while you can still fix it.

## Definition of done

- `npx nx affected -t test build --base=origin/main` passes.
- Every acceptance criterion in the issue is met, with evidence (a test name, a file, a
  command output).
- No TODOs, placeholders or commented-out code left behind.
- Changes are left uncommitted when you run inside the factory: it commits, pushes and opens
  the PR itself.
