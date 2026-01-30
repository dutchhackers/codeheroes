---
description: "Start de volledige lokale dev omgeving (emulators, activity-wall, test users)"
---

# Dev Setup Start

Start de volledige lokale ontwikkelomgeving voor CodeHeroes.

## Stappen

Voer de volgende stappen uit in volgorde:

### 1. Kill bestaande processen op emulator poorten

```bash
lsof -ti:8080,8085,5001,4000,9099,9199,9299 | xargs kill -9 2>/dev/null || true
```

Wacht 2 seconden na het killen.

### 2. Start Firebase emulators (background)

```bash
nx serve firebase-app
```

Start met `run_in_background: true`. Wacht tot "All emulators ready!" verschijnt in de output (controleer met `tail`).

### 3. Start Activity Wall (background)

```bash
nx serve activity-wall
```

Start met `run_in_background: true`.

### 4. Seed de database

```bash
FIREBASE_PROJECT_ID=codeheroes-app-test nx seed database-seeds
```

### 5. Maak test logins aan in Auth emulator

Voor elke test user, maak een Google Sign-In account aan via de Auth emulator REST API:

```bash
curl -s -X POST "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=AIzaSyD5itLlGIFn652bgBi6HOveUuS_4qxnWdE" \
  -H "Content-Type: application/json" \
  -d '{
    "requestUri": "http://localhost:9099/emulator/auth/handler?providerId=google.com&id_token=URL_ENCODED_ID_TOKEN",
    "sessionId": "ValueNotUsedByAuthEmulator",
    "returnSecureToken": true,
    "returnIdpCredential": true
  }'
```

De `id_token` moet URL-encoded JSON zijn:
```json
{
  "sub": "google-USER_ID",
  "email": "USER_EMAIL",
  "name": "DISPLAY_NAME",
  "picture": "PHOTO_URL",
  "email_verified": true
}
```

Het `localId` in de response is de Firebase Auth UID.

### 6. Koppel Firestore users aan Auth users

Update elk user document met het Firebase Auth UID:

```bash
curl -X PATCH "http://localhost:8080/v1/projects/codeheroes-app-test/databases/(default)/documents/users/USER_DOC_ID?updateMask.fieldPaths=uid" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer owner" \
  -d '{"fields": {"uid": {"stringValue": "FIREBASE_AUTH_UID"}}}'
```

### 7. Verificatie

Controleer of alles draait:

1. **Emulator UI**: http://localhost:4000
2. **Activity Wall**: http://localhost:4201
3. **Auth emulator users**: http://localhost:4000/auth

---

## Programmatisch inloggen in Activity Wall (zonder popup)

Om in te loggen in de Activity Wall zonder door de Google popup te klikken, gebruik DevTools MCP om de volgende JavaScript uit te voeren op http://localhost:4201:

```javascript
async () => {
  const apiKey = 'AIzaSyD5itLlGIFn652bgBi6HOveUuS_4qxnWdE';

  // User gegevens - pas aan voor andere users
  const user = {
    sub: "cas-google-id-123",
    email: "cas.van.dinter@framna.com",
    name: "Cassshh",
    picture: "https://github.com/cassshh.png?size=200"
  };

  // Stap 1: Login via Auth emulator REST API
  const idTokenPayload = { ...user, iss: "", aud: "", exp: 0, iat: 0, email_verified: true };
  const encodedIdToken = encodeURIComponent(JSON.stringify(idTokenPayload));

  const response = await fetch(
    `http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestUri: `http://localhost:9099/emulator/auth/handler?providerId=google.com&id_token=${encodedIdToken}`,
        sessionId: "ValueNotUsedByAuthEmulator",
        returnSecureToken: true,
        returnIdpCredential: true
      })
    }
  );

  const data = await response.json();
  if (data.error) return { error: data.error };

  // Stap 2: Tokens opslaan in IndexedDB voor Firebase SDK
  const userObject = {
    uid: data.localId,
    email: data.email,
    emailVerified: data.emailVerified,
    displayName: data.displayName,
    isAnonymous: false,
    photoURL: data.photoUrl,
    providerData: [{
      providerId: "google.com",
      uid: user.sub,
      displayName: data.displayName,
      email: data.email,
      phoneNumber: null,
      photoURL: data.photoUrl
    }],
    stsTokenManager: {
      refreshToken: data.refreshToken,
      accessToken: data.idToken,
      expirationTime: Date.now() + (parseInt(data.expiresIn) * 1000)
    },
    createdAt: Date.now().toString(),
    lastLoginAt: Date.now().toString(),
    apiKey: apiKey,
    appName: "[DEFAULT]"
  };

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('firebaseLocalStorageDb', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
        db.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' });
      }
    };
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction('firebaseLocalStorage', 'readwrite');
      const store = tx.objectStore('firebaseLocalStorage');
      const key = `firebase:authUser:${apiKey}:[DEFAULT]`;

      store.put({ fbase_key: key, value: userObject }).onsuccess = () => {
        resolve({ success: true, uid: data.localId, email: data.email, message: 'Refresh de pagina om ingelogd te zijn' });
      };
    };
    request.onerror = () => reject({ error: 'IndexedDB failed' });
  });
}
```

**Gebruik met DevTools MCP:**
1. `mcp__devtools-mcp__navigate_page` naar http://localhost:4201
2. `mcp__devtools-mcp__evaluate_script` met bovenstaande functie
3. `mcp__devtools-mcp__navigate_page` met `type: "reload"`

De gebruiker is nu ingelogd zonder popup interactie.

### Beschikbare test users

| Naam | Email | Google Sub ID |
|------|-------|---------------|
| Cassshh | cas.van.dinter@framna.com | cas-google-id-123 |
| Nightcrawler | michael.schilling@framna.com | mschilling-google-id |
| Copilot | copilot@github.com | copilot-google-id |
| dependabot[bot] | dependabot@github.com | dependabot-google-id |

---

## Endpoints Reference

| Service | URL |
|---------|-----|
| Emulator UI | http://localhost:4000 |
| Auth Emulator API | http://localhost:9099 |
| Firestore Emulator | http://localhost:8080 |
| Functions | http://localhost:5001 |
| Activity Wall | http://localhost:4201 |

## Troubleshooting

- **Poort in gebruik**: Kill processen handmatig met `lsof -ti:PORT | xargs kill -9`
- **Seeding faalt**: Controleer of emulators volledig gestart zijn
- **Auth user bestaat al**: De emulator geeft een error maar dit is niet blokkerend
- **Login werkt niet na refresh**: Controleer of IndexedDB correct is geschreven (DevTools > Application > IndexedDB)
