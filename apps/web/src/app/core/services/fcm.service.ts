import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { getToken, Messaging } from '@angular/fire/messaging';

import { environment } from '../../../environments/environment';
import { USER_AGENT } from '../utils';

@Injectable({
  providedIn: 'root',
})
export class FcmService {
  readonly #messaging = inject(Messaging);
  readonly #firestore = inject(Firestore);
  readonly #path = 'fcmTokens';
  readonly #user = inject(Auth).currentUser;

  public async requestPermission() {
    return await getToken(this.#messaging, {
      vapidKey: environment.firebase.vapidKey,
    }).catch(() => {
      throw new Error('Requesting the token failed');
    });
  }

  public async saveToken(token: string) {
    const uid = this.#user?.uid;
    if (!uid) {
      throw new Error('User is not authenticated');
    }

    try {
      const document = doc(this.#firestore, this.#path, token);
      setDoc(document, { uid, token, updatedAt: new Date().toISOString(), ua: USER_AGENT }, { merge: true });
    } catch {
      throw new Error('Failed to save token');
    }
  }
}
