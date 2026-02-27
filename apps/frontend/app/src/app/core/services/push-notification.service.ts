import { inject, Injectable, OnDestroy } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { doc, Firestore, getDoc, updateDoc } from '@angular/fire/firestore';
import { collection, query, where, getDocs } from '@angular/fire/firestore';
import { getMessaging, getToken, deleteToken, onMessage, Messaging } from 'firebase/messaging';
import { getApp } from 'firebase/app';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Collections } from '@codeheroes/types';

@Injectable({ providedIn: 'root' })
export class PushNotificationService implements OnDestroy {
  readonly #auth = inject(Auth);
  readonly #firestore = inject(Firestore);
  readonly #authUser$ = user(this.#auth);

  #messaging: Messaging | null = null;
  #currentToken: string | null = null;
  #userDocId: string | null = null;
  #foregroundUnsub: (() => void) | null = null;
  #authSub: Subscription | null = null;
  #refreshInterval: ReturnType<typeof setInterval> | null = null;

  #getMessaging(): Messaging {
    if (!this.#messaging) {
      this.#messaging = getMessaging(getApp());
    }
    return this.#messaging;
  }

  async #resolveUserDocId(): Promise<string | null> {
    if (this.#userDocId) return this.#userDocId;
    const authUser = this.#auth.currentUser;
    if (!authUser) return null;

    const usersRef = collection(this.#firestore, Collections.Users);
    const q = query(usersRef, where('uid', '==', authUser.uid));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    this.#userDocId = snapshot.docs[0].id;
    return this.#userDocId;
  }

  async requestPermission(): Promise<boolean> {
    if (!environment.vapidKey) {
      console.warn('VAPID key not configured — push notifications disabled');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    try {
      // Use the existing combined service worker (registered by Angular via provideServiceWorker)
      const registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) {
        console.error('No service worker registration found');
        return false;
      }

      const token = await getToken(this.#getMessaging(), {
        vapidKey: environment.vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) return false;
      this.#currentToken = token;

      // Save token to Firestore
      await this.#saveToken(token);

      // Set up foreground message handler
      this.#setupForegroundHandler();

      // Refresh token every 24h
      if (this.#refreshInterval) {
        clearInterval(this.#refreshInterval);
      }
      this.#refreshInterval = setInterval(() => this.#refreshToken(), 24 * 60 * 60 * 1000);

      return true;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return false;
    }
  }

  async removeToken(): Promise<void> {
    try {
      if (this.#currentToken) {
        await this.#removeTokenFromFirestore(this.#currentToken);
        await deleteToken(this.#getMessaging());
        this.#currentToken = null;
      }
    } catch (error) {
      console.error('Failed to remove FCM token:', error);
    }

    if (this.#refreshInterval) {
      clearInterval(this.#refreshInterval);
      this.#refreshInterval = null;
    }
  }

  async #saveToken(token: string): Promise<void> {
    const docId = await this.#resolveUserDocId();
    if (!docId) return;

    const settingsRef = doc(this.#firestore, `${Collections.Users}/${docId}/${Collections.Settings}/preferences`);
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      await updateDoc(settingsRef, { fcmTokens: arrayUnion(token) });
    }
  }

  async #removeTokenFromFirestore(token: string): Promise<void> {
    const docId = await this.#resolveUserDocId();
    if (!docId) return;

    const settingsRef = doc(this.#firestore, `${Collections.Users}/${docId}/${Collections.Settings}/preferences`);
    await updateDoc(settingsRef, { fcmTokens: arrayRemove(token) });
  }

  async #refreshToken(): Promise<void> {
    if (!environment.vapidKey) return;
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) return;

      const newToken = await getToken(this.#getMessaging(), {
        vapidKey: environment.vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (newToken && newToken !== this.#currentToken) {
        if (this.#currentToken) {
          await this.#removeTokenFromFirestore(this.#currentToken);
        }
        await this.#saveToken(newToken);
        this.#currentToken = newToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }

  #setupForegroundHandler(): void {
    if (this.#foregroundUnsub) return;
    this.#foregroundUnsub = onMessage(this.#getMessaging(), (payload) => {
      // Foreground notifications are handled by the in-app notification center
      // via Firestore realtime listeners — no additional action needed here.
      console.debug('Foreground FCM message:', payload.data?.['title']);
    });
  }

  ngOnDestroy() {
    this.#authSub?.unsubscribe();
    this.#foregroundUnsub?.();
    if (this.#refreshInterval) clearInterval(this.#refreshInterval);
  }
}
