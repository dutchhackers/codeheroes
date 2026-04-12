import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { InstallationSummaryDto } from '@codeheroes/types';
import { InstallationsService } from '../../core/services/installations.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-repositories',
  standalone: true,
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 py-4 md:px-6 lg:px-8 md:py-5">
      <div class="flex items-center gap-3 relative z-10">
        <button type="button" (click)="goBack()" aria-label="Back" class="back-button">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl md:text-4xl font-bold italic text-white">Repositories</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 px-4 md:px-6 lg:px-8 pb-24">
      <div class="max-w-2xl mx-auto py-8">

        @if (isLoading()) {
          <div class="flex items-center justify-center py-20">
            <div class="text-xl text-purple-400/70 animate-pulse" role="status" aria-live="polite">Loading...</div>
          </div>
        } @else if (isSettingUp()) {
          <div class="flex flex-col items-center justify-center py-20 gap-4">
            <div class="text-xl text-purple-400/70 animate-pulse">Setting up...</div>
            <p class="text-sm text-white/40">Linking your GitHub installation</p>
          </div>
        } @else if (setupError()) {
          <section class="content-section">
            <div class="flex flex-col items-center text-center gap-4 py-8">
              <div class="error-icon">!</div>
              <h2 class="text-lg font-semibold text-white">Setup Failed</h2>
              <p class="text-sm text-white/50 max-w-sm">{{ setupError() }}</p>
              <button type="button" class="action-button" (click)="loadInstallations()">Try Again</button>
            </div>
          </section>
        } @else if (installations().length === 0) {
          <!-- Empty state: no installations -->
          <section class="content-section">
            <div class="flex flex-col items-center text-center gap-5 py-8">
              <div class="github-icon-large" [innerHTML]="githubIcon"></div>
              <h2 class="text-xl font-bold text-white">Connect your repositories</h2>
              <p class="text-sm text-white/50 max-w-sm leading-relaxed">
                Install the Code Heroes GitHub App to track your coding activity.
                You choose which repos — we only read events, never your code.
              </p>
              <a [href]="installUrl" class="action-button" target="_blank" rel="noopener noreferrer">
                Install on GitHub
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </section>
        } @else {
          <!-- Installations list -->
          @for (installation of installations(); track installation.id) {
            <section class="content-section installation-card">
              <div class="installation-header">
                <div class="installation-account">
                  <span class="account-name">{{ installation.accountLogin }}</span>
                  <span class="account-type">{{ installation.accountType }}</span>
                </div>
                <span class="status-badge" [class]="'status-' + installation.status">
                  {{ installation.status }}
                </span>
              </div>

              @if (installation.repositories.length === 0) {
                <p class="text-sm text-white/40 py-2">No repositories selected</p>
              } @else {
                <div class="repo-list">
                  @for (repo of installation.repositories; track repo.id) {
                    <div class="repo-row">
                      <span class="repo-name">{{ repo.name }}</span>
                      @if (repo.private) {
                        <span class="repo-private">private</span>
                      }
                    </div>
                  }
                </div>
              }

              <div class="installation-actions">
                <a [href]="getManageUrl(installation)" class="link-button" target="_blank" rel="noopener noreferrer">
                  Manage on GitHub
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </section>
          }

          <a [href]="installUrl" class="add-more-button" target="_blank" rel="noopener noreferrer">
            + Add more repositories
          </a>
        }
      </div>
    </main>
  `,
  styles: [
    `
      :host { display: block; }

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

      .content-section {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1rem;
      }

      .github-icon-large {
        width: 48px;
        height: 48px;
        color: rgba(255, 255, 255, 0.5);
      }
      .github-icon-large svg { width: 48px; height: 48px; }

      .error-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: rgb(239, 68, 68);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: 700;
      }

      .action-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 10px;
        border: none;
        background: linear-gradient(135deg, rgb(6, 182, 212), rgb(139, 92, 246));
        color: white;
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
      }
      .action-button:hover { box-shadow: 0 0 24px rgba(6, 182, 212, 0.3); }

      .installation-card { margin-bottom: 1rem; }

      .installation-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }

      .installation-account {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .account-name {
        font-size: 1rem;
        font-weight: 600;
        color: white;
      }

      .account-type {
        font-size: 0.6875rem;
        color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.05);
        padding: 0.125rem 0.5rem;
        border-radius: 4px;
        text-transform: lowercase;
      }

      .status-badge {
        font-size: 0.6875rem;
        font-weight: 600;
        padding: 0.25rem 0.625rem;
        border-radius: 9999px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .status-active {
        color: rgb(34, 197, 94);
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid rgba(34, 197, 94, 0.3);
      }
      .status-suspended {
        color: rgb(234, 179, 8);
        background: rgba(234, 179, 8, 0.1);
        border: 1px solid rgba(234, 179, 8, 0.3);
      }
      .status-deleted {
        color: rgb(239, 68, 68);
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
      }

      .repo-list {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .repo-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
      }

      .repo-name {
        font-size: 0.875rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.85);
        font-family: monospace;
      }

      .repo-private {
        font-size: 0.625rem;
        color: rgba(255, 255, 255, 0.35);
        background: rgba(255, 255, 255, 0.05);
        padding: 0.0625rem 0.375rem;
        border-radius: 4px;
      }

      .installation-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }

      .link-button {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
        color: var(--neon-cyan, rgb(6, 182, 212));
        text-decoration: none;
        transition: opacity 0.2s;
      }
      .link-button:hover { opacity: 0.8; }

      .add-more-button {
        display: block;
        text-align: center;
        padding: 0.875rem;
        border: 1px dashed rgba(139, 92, 246, 0.3);
        border-radius: 12px;
        color: rgba(139, 92, 246, 0.7);
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
        transition: all 0.2s;
      }
      .add-more-button:hover {
        border-color: rgba(6, 182, 212, 0.5);
        color: var(--neon-cyan, rgb(6, 182, 212));
        background: rgba(6, 182, 212, 0.05);
      }
    `,
  ],
})
export class RepositoriesComponent implements OnInit, OnDestroy {
  readonly #route = inject(ActivatedRoute);
  readonly #location = inject(Location);
  readonly #installationsService = inject(InstallationsService);

  installations = signal<InstallationSummaryDto[]>([]);
  isLoading = signal(true);
  isSettingUp = signal(false);
  setupError = signal<string | null>(null);

  readonly installUrl = `https://github.com/apps/${environment.githubAppSlug}/installations/new`;

  readonly githubIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`;

  #sub: Subscription | null = null;

  ngOnInit() {
    // Check for GitHub redirect params
    const params = this.#route.snapshot.queryParams;
    const installationId = params['installation_id'];
    const setupAction = params['setup_action'];

    if (installationId && setupAction) {
      this.#setupInstallation(Number(installationId), setupAction);
    } else {
      this.loadInstallations();
    }
  }

  ngOnDestroy() {
    this.#sub?.unsubscribe();
  }

  loadInstallations() {
    this.isLoading.set(true);
    this.setupError.set(null);
    this.#sub?.unsubscribe();

    this.#sub = this.#installationsService.getInstallations().subscribe({
      next: (installations) => {
        this.installations.set(installations);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load installations:', error);
        this.installations.set([]);
        this.isLoading.set(false);
      },
    });
  }

  getManageUrl(installation: InstallationSummaryDto): string {
    return `https://github.com/settings/installations/${installation.id}`;
  }

  goBack() {
    this.#location.back();
  }

  #setupInstallation(installationId: number, setupAction: string) {
    this.isSettingUp.set(true);
    this.isLoading.set(false);

    // Clear query params from URL without navigating away from current route
    this.#location.replaceState(this.#location.path().split('?')[0]);

    this.#sub = this.#installationsService.setupInstallation(installationId, setupAction).subscribe({
      next: () => {
        this.isSettingUp.set(false);
        this.loadInstallations();
      },
      error: (error) => {
        this.isSettingUp.set(false);
        const message =
          error?.error?.error === 'This installation is already linked to another account'
            ? 'This installation is already linked to another account.'
            : 'Failed to set up installation. Please try again.';
        this.setupError.set(message);
      },
    });
  }
}
