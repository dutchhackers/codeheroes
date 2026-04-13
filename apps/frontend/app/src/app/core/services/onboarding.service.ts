import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, combineLatest, map, of, switchMap, catchError, shareReplay } from 'rxjs';
import { Collections, ConnectedAccountDto } from '@codeheroes/types';
import { InstallationsService } from './installations.service';
import { UserSettingsService } from './user-settings.service';
import { UserStatsService } from './user-stats.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  readonly #auth = inject(Auth);
  readonly #firestore = inject(Firestore);
  readonly #injector = inject(Injector);
  readonly #installationsService = inject(InstallationsService);
  readonly #settingsService = inject(UserSettingsService);
  readonly #userStatsService = inject(UserStatsService);
  readonly #authUser$ = user(this.#auth);

  readonly #userDoc$ = this.#userStatsService.getCurrentUserDoc().pipe(shareReplay(1));

  readonly hasGitHubAccount$: Observable<boolean> = this.#userDoc$.pipe(
    switchMap((userDoc) => {
      if (!userDoc) return of(false);
      const accountsRef = collection(this.#firestore, `users/${userDoc.id}/${Collections.ConnectedAccounts}`);
      return runInInjectionContext(this.#injector, () =>
        collectionData(accountsRef, { idField: 'id' }),
      ).pipe(
        map((accounts) => (accounts as ConnectedAccountDto[]).some((a) => a.provider === 'github')),
        catchError(() => of(false)),
      );
    }),
    shareReplay(1),
  );

  readonly hasInstallations$: Observable<boolean> = this.#authUser$.pipe(
    switchMap((authUser) => {
      if (!authUser) return of(false);
      return this.#installationsService.getInstallations().pipe(
        map((installations) => installations.length > 0),
        catchError(() => of(false)),
      );
    }),
    shareReplay(1),
  );

  readonly isOnboardingComplete$: Observable<boolean> = combineLatest([
    this.hasGitHubAccount$,
    this.hasInstallations$,
  ]).pipe(
    map(([hasGitHub, hasInstallations]) => hasGitHub && hasInstallations),
    shareReplay(1),
  );

  readonly shouldShowOnboarding$: Observable<boolean> = this.#userDoc$.pipe(
    switchMap((userDoc) => {
      if (!userDoc) return of(false);
      return combineLatest([
        this.isOnboardingComplete$,
        this.#settingsService.getSettings(userDoc.id).pipe(
          map((s) => s.onboardingDismissed === true),
          catchError(() => of(false)),
        ),
      ]).pipe(
        map(([complete, dismissed]) => !complete && !dismissed),
      );
    }),
    shareReplay(1),
  );

  getUserId$(): Observable<string | null> {
    return this.#userDoc$.pipe(map((doc) => doc?.id ?? null));
  }

  dismissOnboarding(userId: string): Observable<any> {
    return this.#settingsService.updateSettings(userId, { onboardingDismissed: true });
  }

  connectGitHub(returnPath: string = '/onboarding') {
    const clientId = environment.githubOAuthClientId;
    if (!clientId) return;

    const state = crypto.randomUUID();
    localStorage.setItem('githubOAuthState', state);

    const redirectUri = `${window.location.origin}${returnPath}`;
    window.location.href =
      `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=read:user`;
  }

  getGitHubAppInstallUrl(): string {
    return `https://github.com/apps/${environment.githubAppSlug}/installations/new`;
  }
}
