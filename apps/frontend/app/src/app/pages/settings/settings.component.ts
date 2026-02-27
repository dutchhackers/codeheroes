import { Component, inject, signal, OnInit, OnDestroy, Injector, runInInjectionContext } from '@angular/core';
import { DecimalPipe, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { DEFAULT_DAILY_GOAL, ConnectedAccountDto, Collections } from '@codeheroes/types';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { UserStatsService } from '../../core/services/user-stats.service';
import { PushNotificationService } from '../../core/services/push-notification.service';
import { ConnectedAccountsComponent } from '../profile/components/connected-accounts.component';

const GOAL_PRESETS = [4000, 8000, 12000, 16000];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [DecimalPipe, FormsModule, ConnectedAccountsComponent],
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 py-4 md:px-6 lg:px-8 md:py-5">
      <div class="flex items-center gap-3 relative z-10">
        <button type="button" (click)="goBack()" aria-label="Back to profile" class="back-button">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl md:text-4xl font-bold italic text-white">Settings</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 px-4 md:px-6 lg:px-8 pb-24">
      <div class="max-w-2xl mx-auto py-8">
        @if (isLoading()) {
          <div class="flex items-center justify-center py-20">
            <div class="text-xl text-purple-400/70 animate-pulse" role="status" aria-live="polite">
              Loading...
            </div>
          </div>
        } @else {
          <!-- Daily Goal Section -->
          <section class="settings-section">
            <h2 class="section-title">Daily XP Goal</h2>
            <p class="section-description">Set your daily target to stay motivated</p>

            <div class="goal-chips">
              @for (preset of goalPresets; track preset) {
                <button
                  type="button"
                  class="goal-chip"
                  [class.goal-chip-active]="selectedGoal() === preset && !isCustom()"
                  (click)="selectPreset(preset)"
                >
                  {{ preset | number }} XP
                </button>
              }
              <button
                type="button"
                class="goal-chip"
                [class.goal-chip-active]="isCustom()"
                (click)="enableCustom()"
              >
                Custom
              </button>
            </div>

            @if (isCustom()) {
              <div class="custom-input-row">
                <input
                  type="number"
                  class="custom-input"
                  [(ngModel)]="customGoalValue"
                  [min]="1000"
                  [max]="100000"
                  step="500"
                  placeholder="Enter XP goal..."
                />
                <span class="custom-input-suffix">XP</span>
              </div>
            }

            <button
              type="button"
              class="save-button"
              [disabled]="!hasGoalChanges() || isSavingGoal()"
              (click)="saveGoal()"
            >
              {{ isSavingGoal() ? 'Saving...' : 'Save Goal' }}
            </button>

            @if (goalSaveSuccess()) {
              <p class="save-success">Goal updated!</p>
            }
            @if (goalSaveError()) {
              <p class="save-error">Failed to save goal. Please try again.</p>
            }
          </section>

          <!-- Notifications Section -->
          <section class="settings-section">
            <h2 class="section-title">Notifications</h2>
            @if (notificationSaveError()) {
              <p class="save-error" style="margin-bottom: 0.75rem">Failed to update notification setting. Please try again.</p>
            }
            <div class="toggle-row">
              <div>
                <p class="toggle-label">Enable Notifications</p>
                <p class="toggle-description">Push notifications for achievements and level ups</p>
              </div>
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  [checked]="notificationsEnabled()"
                  (change)="toggleNotifications()"
                  [disabled]="isSavingNotifications()"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </section>

          <!-- Connected Accounts Section -->
          <section class="settings-section">
            <h2 class="section-title">Connected Accounts</h2>
            <p class="section-description">Accounts linked to your profile</p>
            <app-connected-accounts [accounts]="connectedAccounts()" [showTitle]="false" />
          </section>

          <!-- Account Section -->
          <section class="settings-section">
            <h2 class="section-title">Account</h2>
            <div class="account-info-grid">
              @if (userEmail()) {
                <div class="account-info-row">
                  <span class="account-info-label">Email</span>
                  <span class="account-info-value">{{ userEmail() }}</span>
                </div>
              }
              @if (memberSince()) {
                <div class="account-info-row">
                  <span class="account-info-label">Member Since</span>
                  <span class="account-info-value">{{ memberSince() }}</span>
                </div>
              }
            </div>
          </section>

          <!-- Community Section -->
          <section class="settings-section">
            <h2 class="section-title">Community</h2>
            <div class="link-row link-row-static">
              <svg class="link-row-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.315z"/>
              </svg>
              <span class="link-row-text">Join us on Slack: <strong>#codeheroes</strong></span>
            </div>
          </section>

          <!-- About Section -->
          <section class="settings-section">
            <h2 class="section-title">About</h2>
            <a class="link-row" href="https://github.com/dutchhackers/codeheroes" target="_blank" rel="noopener noreferrer" aria-label="Code Heroes on GitHub (opens in new tab)">
              <svg class="link-row-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              <span class="link-row-text">Code Heroes on GitHub</span>
              <svg class="link-row-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <div class="about-branding">
              <span class="about-name">Code Heroes</span>
              <span class="about-tagline">Level up your dev game</span>
            </div>
          </section>
        }
      </div>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
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

      .back-button:hover {
        color: white;
        border-color: rgba(255, 255, 255, 0.4);
      }

      .settings-section {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .section-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: white;
        margin-bottom: 0.25rem;
      }

      .section-description {
        font-size: 0.875rem;
        color: rgb(148, 163, 184);
        margin-bottom: 1.25rem;
      }

      .goal-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1.25rem;
      }

      .goal-chip {
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        border: 1px solid rgba(139, 92, 246, 0.3);
        background: rgba(0, 0, 0, 0.3);
        color: rgb(148, 163, 184);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .goal-chip:hover {
        border-color: rgba(6, 182, 212, 0.5);
        color: white;
      }

      .goal-chip-active {
        border-color: var(--neon-cyan);
        background: rgba(6, 182, 212, 0.15);
        color: var(--neon-cyan);
        box-shadow: 0 0 12px rgba(6, 182, 212, 0.2);
      }

      .custom-input-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1.25rem;
      }

      .custom-input {
        width: 160px;
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        border: 1px solid rgba(139, 92, 246, 0.3);
        background: rgba(0, 0, 0, 0.5);
        color: white;
        font-size: 0.875rem;
        outline: none;
        transition: border-color 0.2s;
      }

      .custom-input:focus {
        border-color: var(--neon-cyan);
      }

      .custom-input-suffix {
        font-size: 0.875rem;
        color: rgb(148, 163, 184);
      }

      .save-button {
        padding: 0.625rem 1.5rem;
        border-radius: 8px;
        border: none;
        background: linear-gradient(135deg, rgb(6, 182, 212), rgb(139, 92, 246));
        color: white;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .save-button:hover:not(:disabled) {
        box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
      }

      .save-button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .save-success {
        font-size: 0.875rem;
        color: rgb(34, 197, 94);
        margin-top: 0.75rem;
        padding: 0.625rem 1rem;
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid rgba(34, 197, 94, 0.3);
        border-radius: 8px;
        animation: fadeIn 0.3s ease;
      }

      .save-error {
        font-size: 0.875rem;
        color: rgb(239, 68, 68);
        margin-top: 0.75rem;
        padding: 0.625rem 1rem;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 8px;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .toggle-label {
        font-size: 0.9375rem;
        font-weight: 500;
        color: white;
      }

      .toggle-description {
        font-size: 0.8125rem;
        color: rgb(148, 163, 184);
        margin-top: 0.125rem;
      }

      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 48px;
        height: 28px;
        flex-shrink: 0;
      }

      .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .toggle-slider {
        position: absolute;
        cursor: pointer;
        inset: 0;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        transition: all 0.3s;
      }

      .toggle-slider::before {
        content: '';
        position: absolute;
        height: 22px;
        width: 22px;
        left: 3px;
        bottom: 3px;
        background: white;
        border-radius: 50%;
        transition: all 0.3s;
      }

      .toggle-switch input:checked + .toggle-slider {
        background: var(--neon-cyan);
      }

      .toggle-switch input:checked + .toggle-slider::before {
        transform: translateX(20px);
      }

      .account-info-grid {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .account-info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.625rem 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      }

      .account-info-label {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.5);
      }

      .account-info-value {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;
      }

      .link-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s;
      }

      .link-row:hover {
        background: rgba(139, 92, 246, 0.1);
        border-color: rgba(139, 92, 246, 0.3);
        box-shadow: 0 0 16px rgba(139, 92, 246, 0.15);
      }

      .link-row:focus-visible {
        outline: 2px solid var(--neon-cyan);
        outline-offset: 2px;
        background: rgba(139, 92, 246, 0.12);
        border-color: rgba(139, 92, 246, 0.4);
        box-shadow: 0 0 18px rgba(139, 92, 246, 0.3);
      }

      .link-row-static {
        cursor: default;
      }

      .link-row-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        color: rgb(148, 163, 184);
        transition: color 0.2s;
      }

      .link-row:hover .link-row-icon {
        color: var(--neon-cyan);
      }

      .link-row-text {
        flex: 1;
        font-size: 0.9375rem;
        font-weight: 500;
      }

      .link-row-chevron {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        color: rgba(255, 255, 255, 0.3);
        transition: color 0.2s;
      }

      .link-row:hover .link-row-chevron {
        color: rgba(255, 255, 255, 0.6);
      }

      .about-branding {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        margin-top: 1.25rem;
        padding-top: 1.25rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }

      .about-name {
        font-size: 0.9375rem;
        font-weight: 700;
        font-style: italic;
        background: linear-gradient(135deg, var(--neon-cyan), rgb(139, 92, 246));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .about-tagline {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.35);
      }
    `,
  ],
})
export class SettingsComponent implements OnInit, OnDestroy {
  readonly #location = inject(Location);
  readonly #firestore = inject(Firestore);
  readonly #injector = inject(Injector);
  readonly #settingsService = inject(UserSettingsService);
  readonly #userStatsService = inject(UserStatsService);
  readonly #pushService = inject(PushNotificationService);

  readonly goalPresets = GOAL_PRESETS;

  isLoading = signal(true);
  selectedGoal = signal(DEFAULT_DAILY_GOAL);
  isCustom = signal(false);
  customGoalValue = DEFAULT_DAILY_GOAL;
  notificationsEnabled = signal(true);
  isSavingGoal = signal(false);
  isSavingNotifications = signal(false);
  goalSaveSuccess = signal(false);
  goalSaveError = signal(false);
  notificationSaveError = signal(false);

  connectedAccounts = signal<ConnectedAccountDto[]>([]);
  userEmail = signal<string | null>(null);
  memberSince = signal<string | null>(null);

  #userId: string | null = null;
  #originalGoal = DEFAULT_DAILY_GOAL;
  #originalNotifications = true;
  #userSub: Subscription | null = null;
  #connectedAccountsSub: Subscription | null = null;
  #successTimeout: ReturnType<typeof setTimeout> | null = null;
  #errorTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.#userSub = this.#userStatsService.getCurrentUserDoc().subscribe({
      next: (userDoc) => {
        if (!userDoc) {
          this.isLoading.set(false);
          return;
        }
        this.#userId = userDoc.id;
        this.#loadSettings(userDoc.id);
        this.#loadConnectedAccounts(userDoc.id);

        // Set account info
        this.userEmail.set(userDoc.email);
        const date = new Date(userDoc.createdAt);
        if (!isNaN(date.getTime())) {
          this.memberSince.set(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  ngOnDestroy() {
    this.#userSub?.unsubscribe();
    this.#connectedAccountsSub?.unsubscribe();
    if (this.#successTimeout) clearTimeout(this.#successTimeout);
    if (this.#errorTimeout) clearTimeout(this.#errorTimeout);
  }

  #loadConnectedAccounts(userId: string) {
    const accountsRef = collection(this.#firestore, `users/${userId}/${Collections.ConnectedAccounts}`);
    this.#connectedAccountsSub = runInInjectionContext(this.#injector, () =>
      collectionData(accountsRef, { idField: 'id' }),
    ).subscribe({
      next: (accounts) => this.connectedAccounts.set(accounts as ConnectedAccountDto[]),
      error: (error) => console.error('Failed to load connected accounts:', error),
    });
  }

  #loadSettings(userId: string) {
    this.#settingsService.getSettings(userId).subscribe({
      next: (settings) => {
        const goal = settings.dailyGoal ?? DEFAULT_DAILY_GOAL;
        this.#originalGoal = goal;
        this.#originalNotifications = settings.notificationsEnabled ?? true;

        this.selectedGoal.set(goal);
        this.notificationsEnabled.set(this.#originalNotifications);

        if (!GOAL_PRESETS.includes(goal)) {
          this.isCustom.set(true);
          this.customGoalValue = goal;
        }

        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  selectPreset(value: number) {
    this.isCustom.set(false);
    this.selectedGoal.set(value);
    this.goalSaveSuccess.set(false);
  }

  enableCustom() {
    this.isCustom.set(true);
    this.customGoalValue = this.selectedGoal();
    this.goalSaveSuccess.set(false);
  }

  hasGoalChanges(): boolean {
    const current = this.isCustom() ? this.customGoalValue : this.selectedGoal();
    return current !== this.#originalGoal && current >= 1000 && current <= 100000;
  }

  saveGoal() {
    if (!this.#userId || !this.hasGoalChanges()) return;

    const goal = this.isCustom() ? this.customGoalValue : this.selectedGoal();
    this.isSavingGoal.set(true);
    this.goalSaveSuccess.set(false);

    this.#settingsService.updateSettings(this.#userId, { dailyGoal: goal }).subscribe({
      next: () => {
        this.#originalGoal = goal;
        this.selectedGoal.set(goal);
        this.isSavingGoal.set(false);
        this.goalSaveSuccess.set(true);
        this.#successTimeout = setTimeout(() => this.goalSaveSuccess.set(false), 3000);
      },
      error: () => {
        this.isSavingGoal.set(false);
        this.goalSaveError.set(true);
        this.#errorTimeout = setTimeout(() => this.goalSaveError.set(false), 5000);
      },
    });
  }

  toggleNotifications() {
    if (!this.#userId) return;

    const newValue = !this.notificationsEnabled();
    this.isSavingNotifications.set(true);

    this.#settingsService.updateSettings(this.#userId, { notificationsEnabled: newValue }).subscribe({
      next: async () => {
        this.notificationsEnabled.set(newValue);
        this.#originalNotifications = newValue;

        // Wire push notification service
        try {
          if (newValue) {
            await this.#pushService.requestPermission();
          } else {
            await this.#pushService.removeToken();
          }
        } catch (error) {
          console.error('Push notification toggle failed:', error);
          // Revert settings since push service failed
          this.notificationsEnabled.set(!newValue);
          this.#originalNotifications = !newValue;
          this.#settingsService.updateSettings(this.#userId!, { notificationsEnabled: !newValue }).subscribe();
          this.notificationSaveError.set(true);
          this.#errorTimeout = setTimeout(() => this.notificationSaveError.set(false), 5000);
        }

        this.isSavingNotifications.set(false);
      },
      error: () => {
        this.isSavingNotifications.set(false);
        this.notificationSaveError.set(true);
        this.#errorTimeout = setTimeout(() => this.notificationSaveError.set(false), 5000);
      },
    });
  }

  goBack() {
    this.#location.back();
  }
}
