import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { Subscription, take } from 'rxjs';
import { OnboardingService } from '../../core/services/onboarding.service';
import { InstallationsService } from '../../core/services/installations.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  template: `
    <div class="onboarding-container">
      <!-- Header -->
      <header class="onboarding-header">
        <button type="button" (click)="goBack()" class="back-button" aria-label="Back">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="onboarding-title">Get Started</h1>
      </header>

      <!-- Step Indicator -->
      <div class="step-indicator">
        <div class="step-dot" [class.step-done]="githubConnected()" [class.step-active]="!githubConnected()">
          @if (githubConnected()) { <span class="step-check">&#10003;</span> } @else { <span>1</span> }
        </div>
        <div class="step-line" [class.step-line-done]="githubConnected()"></div>
        <div class="step-dot" [class.step-done]="appInstalled()" [class.step-active]="githubConnected() && !appInstalled()">
          @if (appInstalled()) { <span class="step-check">&#10003;</span> } @else { <span>2</span> }
        </div>
      </div>
      <div class="step-labels">
        <span [class.step-label-active]="!githubConnected()">GitHub</span>
        <span [class.step-label-active]="githubConnected() && !appInstalled()">Repos</span>
      </div>

      <!-- Content -->
      <main class="onboarding-content">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="loading-pulse">Loading...</div>
          </div>
        } @else if (isProcessing()) {
          <div class="loading-state">
            <div class="loading-pulse">Setting up...</div>
          </div>
        } @else if (allComplete()) {
          <!-- All done! -->
          <div class="step-card">
            <div class="completion-icon">&#127881;</div>
            <h2 class="step-title">You're all set!</h2>
            <p class="step-description">
              Your coding activity is now being tracked.
              Push some code to earn your first XP!
              Redirecting to dashboard...
            </p>
            <button type="button" class="action-button" (click)="goToDashboard()">
              Go to Dashboard
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        } @else if (!githubConnected()) {
          <!-- Step 1: Connect GitHub -->
          <div class="step-card">
            <div class="step-icon" [innerHTML]="githubIcon"></div>
            <h2 class="step-title">Connect GitHub</h2>
            <p class="step-description">
              Link your GitHub account so we can track
              your commits, PRs, and code reviews.
            </p>
            @if (error()) {
              <p class="error-text">{{ error() }}</p>
            }
            <button type="button" class="action-button" (click)="connectGitHub()">
              Connect GitHub
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
        } @else {
          <!-- Step 2: Install App -->
          <div class="step-card">
            <div class="step-icon" [innerHTML]="repoIcon"></div>
            <h2 class="step-title">Track your repos</h2>
            <p class="step-description">
              Install the Code Heroes app on your GitHub
              repositories to start earning XP.
            </p>
            <a [href]="installUrl" class="action-button" target="_self">
              Install on GitHub
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        }
      </main>

      <!-- Skip -->
      @if (!allComplete() && !isLoading() && !isProcessing()) {
        <button type="button" class="skip-button" (click)="skip()">
          Skip for now
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }

      .onboarding-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1.5rem;
      }

      .onboarding-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        max-width: 480px;
        margin-bottom: 2rem;
      }

      .back-button {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 0.5rem;
        min-width: 40px;
        min-height: 40px;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .back-button:hover { color: white; border-color: rgba(255, 255, 255, 0.4); }

      .onboarding-title {
        font-size: 1.75rem;
        font-weight: 700;
        font-style: italic;
        color: white;
        margin: 0;
      }

      .step-indicator {
        display: flex;
        align-items: center;
        gap: 0;
        margin-bottom: 0.5rem;
      }

      .step-dot {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 600;
        border: 2px solid rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.3);
        background: transparent;
        transition: all 0.3s;
      }

      .step-active {
        border-color: var(--neon-cyan, rgb(6, 182, 212));
        color: var(--neon-cyan, rgb(6, 182, 212));
        background: rgba(6, 182, 212, 0.1);
        box-shadow: 0 0 12px rgba(6, 182, 212, 0.2);
      }

      .step-done {
        border-color: rgb(34, 197, 94);
        color: rgb(34, 197, 94);
        background: rgba(34, 197, 94, 0.1);
      }

      .step-check { font-size: 1rem; }

      .step-line {
        width: 60px;
        height: 2px;
        background: rgba(255, 255, 255, 0.1);
        transition: background 0.3s;
      }
      .step-line-done { background: rgb(34, 197, 94); }

      .step-labels {
        display: flex;
        gap: 60px;
        margin-bottom: 2rem;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.3);
      }
      .step-label-active { color: var(--neon-cyan, rgb(6, 182, 212)); }

      .onboarding-content {
        width: 100%;
        max-width: 480px;
      }

      .step-card {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 20px;
        padding: 2rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .step-icon {
        width: 48px;
        height: 48px;
        color: rgba(255, 255, 255, 0.5);
      }
      .step-icon svg { width: 48px; height: 48px; }

      .completion-icon { font-size: 3rem; }

      .step-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
        margin: 0;
      }

      .step-description {
        font-size: 0.9375rem;
        color: rgba(255, 255, 255, 0.5);
        line-height: 1.5;
        margin: 0;
        max-width: 320px;
      }

      .error-text {
        font-size: 0.875rem;
        color: rgb(239, 68, 68);
        padding: 0.5rem 1rem;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 8px;
        margin: 0;
      }

      .action-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.875rem 1.75rem;
        border-radius: 12px;
        border: none;
        background: linear-gradient(135deg, rgb(6, 182, 212), rgb(139, 92, 246));
        color: white;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
        margin-top: 0.5rem;
      }
      .action-button:hover { box-shadow: 0 0 28px rgba(6, 182, 212, 0.35); }

      .skip-button {
        margin-top: 1.5rem;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.35);
        font-size: 0.875rem;
        cursor: pointer;
        padding: 0.5rem 1rem;
        transition: color 0.2s;
      }
      .skip-button:hover { color: rgba(255, 255, 255, 0.6); }

      .loading-state {
        display: flex;
        justify-content: center;
        padding: 4rem 0;
      }

      .loading-pulse {
        color: rgba(139, 92, 246, 0.7);
        font-size: 1.125rem;
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
    `,
  ],
})
export class OnboardingComponent implements OnInit, OnDestroy {
  readonly #router = inject(Router);
  readonly #location = inject(Location);
  readonly #auth = inject(Auth);
  readonly #onboardingService = inject(OnboardingService);
  readonly #installationsService = inject(InstallationsService);

  githubConnected = signal(false);
  appInstalled = signal(false);
  isLoading = signal(true);
  isProcessing = signal(false);
  error = signal<string | null>(null);

  allComplete = computed(() => this.githubConnected() && this.appInstalled());

  readonly installUrl = this.#onboardingService.getGitHubAppInstallUrl();

  readonly githubIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>`;
  readonly repoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>`;

  #subs: Subscription[] = [];
  #userId: string | null = null;
  #redirectTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    // Load onboarding state
    this.#subs.push(
      this.#onboardingService.getUserId$().subscribe((id) => (this.#userId = id)),
      this.#onboardingService.hasGitHubAccount$.subscribe((v) => {
        this.githubConnected.set(v);
        this.isLoading.set(false);
      }),
      this.#onboardingService.hasInstallations$.subscribe((v) => {
        this.appInstalled.set(v);
        this.#checkAutoRedirect();
      }),
    );

    // Handle GitHub OAuth callback
    this.#handleOAuthCallback();

    // Handle GitHub App install callback
    this.#handleInstallCallback();
  }

  ngOnDestroy() {
    this.#subs.forEach((s) => s.unsubscribe());
    if (this.#redirectTimeout) clearTimeout(this.#redirectTimeout);
  }

  connectGitHub() {
    this.#onboardingService.connectGitHub('/onboarding');
  }

  skip() {
    if (this.#userId) {
      this.#onboardingService.dismissOnboarding(this.#userId).subscribe({
        next: () => this.#router.navigate(['/hq']),
        error: () => this.#router.navigate(['/hq']),
      });
    } else {
      this.#router.navigate(['/hq']);
    }
  }

  goToDashboard() {
    this.#router.navigate(['/hq']);
  }

  goBack() {
    this.#location.back();
  }

  #checkAutoRedirect() {
    if (this.allComplete() && !this.#redirectTimeout) {
      this.#redirectTimeout = setTimeout(() => this.#router.navigate(['/hq']), 3000);
    }
  }

  #handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) return;

    const savedState = localStorage.getItem('githubOAuthState');
    localStorage.removeItem('githubOAuthState');

    window.history.replaceState({}, '', window.location.pathname);

    if (state !== savedState) {
      this.error.set('GitHub authentication failed. Please try again.');
      return;
    }

    this.isProcessing.set(true);

    // Wait for userId to be available
    this.#onboardingService.getUserId$().pipe(take(1)).subscribe(async (userId) => {
      if (!userId) {
        this.error.set('User not found. Please try again.');
        this.isProcessing.set(false);
        return;
      }

      try {
        const token = await this.#auth.currentUser?.getIdToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${environment.apiUrl}/users/${userId}/connect-github`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!response.ok && response.status !== 409) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Failed: ${response.status}`);
        }

        this.githubConnected.set(true);
        this.isProcessing.set(false);
        this.#checkAutoRedirect();
      } catch (err: any) {
        this.error.set(`Failed to connect GitHub: ${err?.message || 'Unknown error'}`);
        this.isProcessing.set(false);
      }
    });
  }

  #handleInstallCallback() {
    const params = new URLSearchParams(window.location.search);
    const installationId = params.get('installation_id');
    const setupAction = params.get('setup_action');

    if (!installationId || !setupAction) return;

    const numericId = Number(installationId);
    if (isNaN(numericId) || numericId <= 0) {
      this.error.set('Invalid installation ID.');
      return;
    }

    window.history.replaceState({}, '', window.location.pathname);
    this.isProcessing.set(true);

    this.#installationsService.setupInstallation(numericId, setupAction).subscribe({
      next: () => {
        this.appInstalled.set(true);
        this.isProcessing.set(false);
      },
      error: (err) => {
        this.isProcessing.set(false);
        // 409 = already linked, treat as success
        if (err?.status === 409) {
          this.appInstalled.set(true);
        } else {
          this.error.set('Failed to set up installation. Please try again.');
          console.error('Installation setup error:', err);
        }
      },
    });
  }
}
