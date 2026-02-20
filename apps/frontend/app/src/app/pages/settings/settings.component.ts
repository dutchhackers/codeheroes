import { Component, inject, signal, OnInit, OnDestroy, Injector, runInInjectionContext } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { DEFAULT_DAILY_GOAL, ConnectedAccountDto, Collections } from '@codeheroes/types';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { UserStatsService } from '../../core/services/user-stats.service';
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
                <p class="toggle-description">Receive updates about your progress</p>
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
            <app-connected-accounts [accounts]="connectedAccounts()" />
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
    `,
  ],
})
export class SettingsComponent implements OnInit, OnDestroy {
  readonly #router = inject(Router);
  readonly #firestore = inject(Firestore);
  readonly #injector = inject(Injector);
  readonly #settingsService = inject(UserSettingsService);
  readonly #userStatsService = inject(UserStatsService);

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
      next: () => {
        this.notificationsEnabled.set(newValue);
        this.#originalNotifications = newValue;
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
    this.#router.navigate(['/profile']);
  }
}
