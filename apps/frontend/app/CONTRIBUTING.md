# Contributing to Code Heroes App

Developer guidelines and best practices for the Code Heroes frontend application.

## Firebase AngularFire Best Practices

### Avoiding Injection Context Warnings

Firebase AngularFire functions (`collectionData`, `docData`, `user`, `getDocs`, etc.) use Angular's `inject()` internally and must be called within an injection context. When called outside this context (e.g., inside `switchMap` callbacks or async methods), you'll see console warnings:

```
Firebase API called outside injection context: collectionData
```

**Solution: Use `runInInjectionContext`**

```typescript
import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { collectionData, docData, getDocs } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class MyService {
  readonly #firestore = inject(Firestore);
  readonly #injector = inject(Injector);

  // BAD: Called inside switchMap callback - outside injection context
  getData(): Observable<Item[]> {
    return this.auth$.pipe(
      switchMap((user) => {
        const ref = collection(this.#firestore, 'items');
        return collectionData(ref); // Warning!
      }),
    );
  }

  // GOOD: Wrapped with runInInjectionContext
  getData(): Observable<Item[]> {
    return this.auth$.pipe(
      switchMap((user) => {
        const ref = collection(this.#firestore, 'items');
        return runInInjectionContext(this.#injector, () =>
          collectionData(ref),
        );
      }),
    );
  }
}
```

**When to use `runInInjectionContext`:**

| Function Type | Examples | Needs Wrapper? |
|---------------|----------|---------------|
| Observable-based (realtime) | `collectionData`, `docData`, `user` | Yes, if in callback |
| Promise-based (one-time) | `getDocs`, `getDoc`, `setDoc`, `addDoc` | No* |
| Field initializer | `readonly x$ = user(auth)` | No |

*Promise-based functions do not show injection context warnings and do not require wrapping with `runInInjectionContext`.

**Pattern used in this codebase:**

1. Inject `Injector` in the service
2. Initialize `user()` observable as a field (called at construction time)
3. Wrap all `collectionData` and `docData` calls in `runInInjectionContext`

### Realtime vs One-time Queries

| Use Case | Function | Returns |
|----------|----------|---------|
| Live updates (subscriptions) | `collectionData()`, `docData()` | `Observable<T>` |
| One-time fetch | `getDocs()`, `getDoc()` | `Promise<Snapshot>` |

Prefer `collectionData`/`docData` for UI-bound data that should update in real-time.

## Service Patterns

### Data Services Structure

Services in `core/services/` follow this pattern:

```typescript
@Injectable({ providedIn: 'root' })
export class MyDataService {
  // 1. Injected dependencies (private, readonly)
  readonly #firestore = inject(Firestore);
  readonly #auth = inject(Auth);
  readonly #injector = inject(Injector);

  // 2. Observables initialized at construction time
  readonly #authUser$ = user(this.#auth);

  // 3. Public methods returning Observables
  getData(): Observable<Data> {
    return this.#authUser$.pipe(
      switchMap((user) => {
        if (!user) return of(null);
        // Use runInInjectionContext for Firebase calls
        return runInInjectionContext(this.#injector, () =>
          docData(doc(this.#firestore, `path/${user.uid}`)),
        );
      }),
    );
  }
}
```

### Current User Pattern

Always get the current user's Firestore document by querying the `uid` field:

```typescript
#getCurrentUserDoc(): Observable<UserDto | null> {
  return this.#authUser$.pipe(
    switchMap((authUser) => {
      if (!authUser?.uid) return of(null);

      const usersRef = collection(this.#firestore, 'users');
      const usersQuery = query(usersRef, where('uid', '==', authUser.uid));

      return runInInjectionContext(this.#injector, () =>
        collectionData(usersQuery, { idField: 'id' }),
      ).pipe(
        map((users) => (users as UserDto[])[0] ?? null),
      );
    }),
  );
}
```

## Component Patterns

### Signal-based State

Use Angular signals for component state:

```typescript
@Component({ ... })
export class MyComponent implements OnInit {
  readonly #service = inject(MyService);

  // Signals for state
  isLoading = signal(true);
  data = signal<Data | null>(null);

  // Subscriptions for cleanup
  #dataSub: Subscription | null = null;

  ngOnInit() {
    this.#dataSub = this.#service.getData().subscribe({
      next: (data) => {
        this.data.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  ngOnDestroy() {
    this.#dataSub?.unsubscribe();
  }
}
```

### Loading States

Always show loading states for async data:

```html
@if (isLoading()) {
  <div class="skeleton-loader">...</div>
} @else if (data()) {
  <!-- Render data -->
} @else {
  <div class="empty-state">No data available</div>
}
```

## Code Style

### Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Private fields | `#` prefix | `#firestore`, `#authUser$` |
| Observables | `$` suffix | `user$`, `activities$` |
| Signals | No suffix | `isLoading`, `data` |
| Injected services | `readonly #` | `readonly #http = inject(HttpClient)` |

### File Structure

```
core/
  services/           # Data services (Firebase, API)
  models/             # TypeScript interfaces/types
pages/
  hq/                 # HQ page feature
    components/       # Page-specific components
    hq.component.ts   # Main page component
shared/
  components/         # Shared UI components
  pipes/              # Custom pipes
```

## Testing Locally

```bash
# With emulators (recommended for development)
nx serve app

# With test Firebase project
nx serve app --configuration=test
```

## Common Issues

### "Firebase API called outside injection context"

See [Firebase AngularFire Best Practices](#firebase-angularfire-best-practices) above.

### Profile/HQ shows "Loading..." forever

Check if:
1. You're authenticated (sign in with Google)
2. Your Google account has a matching `users` document in Firestore with the same `uid`
3. Firebase Auth emulator is running (if using local development)

### Activity data not showing

The Activity Wall uses a `collectionGroup` query across all users' activities. Your personal HQ page only shows YOUR activities from `users/{yourId}/activities`. If you're logged in with an account that has no activities, HQ will show empty data even if the Activity Wall shows data from other users.
