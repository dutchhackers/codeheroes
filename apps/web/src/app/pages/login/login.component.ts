import { NgTemplateOutlet } from '@angular/common';
import type { ElementRef } from '@angular/core';
import { Component, inject, signal, viewChild } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { asyncScheduler } from 'rxjs';

import { NotificationComponent } from '../../components';
import { darkModeEnabled } from '../../core/utils';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [NgTemplateOutlet, NotificationComponent],
})
export class LoginComponent {
  protected videoElement = viewChild<ElementRef<HTMLVideoElement>>('video');

  readonly #auth = inject(Auth);

  protected readonly errorMessage = signal<string>('');
  protected readonly isProcessing = signal(false);

  protected darkModeEnabled = darkModeEnabled;

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

  public canPlayVideo() {
    const element = this.videoElement()?.nativeElement;
    if (!element) {
      return;
    }

    const duration = element.duration - 0.5;
    element.play();

    asyncScheduler.schedule(() => {
      element.classList.add('finished');
    }, duration * 1000);
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
