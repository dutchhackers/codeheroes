import { Component, inject, signal } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';

@Component({
  template: `
    <div class="w-96 mx-auto my-8 p-4 border-2 border-slate-300 rounded-lg">
      <div class="flex items-center mb-4">
        <img src="images/logo.svg" alt="Codeheroes logo" class="w-6 mr-3 -mt-2" />
        <h1>Login</h1>
      </div>

      <button [disabled]="isProcessing()" (click)="signIn()">
        {{ isProcessing() ? 'Signing in...' : 'Sign in with Google' }}
      </button>
      @if (errorMessage()) {
        <p class="error-message">{{ errorMessage() }}</p>
      }
    </div>
  `,
  styles: `
    .error-message {
      color: #dc3545;
      margin-top: 0.5rem;
    }
  `,
})
export class LoginComponent {
  readonly #auth = inject(Auth);
  protected readonly errorMessage = signal<string>('');
  protected readonly isProcessing = signal(false);

  async signIn(): Promise<boolean> {
    this.errorMessage.set('');
    this.isProcessing.set(true);

    try {
      const token = await this.#signInFirebase();
      return !!token;
    } catch (error: unknown) {
      const errorMessage = this.#parseError(error);
      this.errorMessage.set(errorMessage);
      return false;
    } finally {
      this.isProcessing.set(false);
    }
  }

  async #signInFirebase(): Promise<string | undefined> {
    const result = await signInWithPopup(this.#auth, new GoogleAuthProvider());
    return result.user?.getIdToken();
  }

  #parseError(error: unknown): string {
    if (typeof error !== 'object' || !error) {
      return 'An unknown error occurred';
    }

    const errorObj = error as { code?: string; message?: string };

    if (errorObj.code === 'auth/internal-error') {
      const matches = errorObj.message?.match(/\{.*\}/);
      if (matches) {
        try {
          const serverError = JSON.parse(matches[0]);
          console.error('Server error details:', serverError);
          return serverError.error.message;
        } catch (jsonError) {
          console.error('Failed to parse server error:', jsonError);
        }
      }
      return 'An unexpected server error occurred';
    }

    return errorObj.message || 'An unknown error occurred';
  }
}
