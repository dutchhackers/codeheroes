import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'admin-login',
  standalone: true,
  imports: [SuiButtonComponent],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">CH</div>
          <h1 class="login-title">Code Heroes</h1>
          <p class="login-subtitle">Admin Portal</p>
        </div>
        @if (error) {
          <div class="login-error">
            {{ error }}
          </div>
        }
        <sui-button
          variant="outline"
          color="neutral"
          size="lg"
          [disabled]="isSigningIn"
          [loading]="isSigningIn"
          (click)="signIn()"
        >
          <svg class="google-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </sui-button>
      </div>
    </div>
  `,
  styles: [
    `
      .login-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: var(--theme-color-bg-neutral-secondary);
      }

      .login-card {
        background: var(--theme-color-bg-surface-default);
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 12px;
        padding: 40px 32px;
        width: 100%;
        max-width: 380px;
        box-shadow: var(--theme-effect-styles-drop-shadow-200);
      }

      .login-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .login-logo {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: var(--theme-color-bg-brand-default);
        color: white;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 18px;
        margin-bottom: 16px;
      }

      .login-title {
        font-size: 22px;
        font-weight: 700;
        color: var(--theme-color-text-default);
        margin-bottom: 4px;
      }

      .login-subtitle {
        font-size: 14px;
        color: var(--theme-color-text-neutral-tertiary);
      }

      .login-error {
        margin-bottom: 16px;
        padding: 12px;
        border-radius: 8px;
        background: var(--theme-color-feedback-bg-error-secondary);
        border: 1px solid var(--theme-color-feedback-border-error-default);
        color: var(--theme-color-feedback-text-error-default);
        font-size: 14px;
      }

      .google-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      sui-button {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class LoginComponent {
  readonly #auth = inject(AuthService);
  readonly #router = inject(Router);

  isSigningIn = false;
  error: string | null = null;

  async signIn(): Promise<void> {
    this.isSigningIn = true;
    this.error = null;
    try {
      await this.#auth.signInWithGoogle();
      await this.#auth.forceTokenRefresh();

      if (!this.#auth.isAdmin()) {
        this.error = 'Access denied. Your account does not have admin privileges.';
        await this.#auth.signOut();
        return;
      }

      await this.#router.navigate(['/']);
    } catch (err) {
      this.error = 'Sign-in failed. Please try again.';
      console.error('Google sign-in failed:', err);
    } finally {
      this.isSigningIn = false;
    }
  }
}
