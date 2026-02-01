---
description: "Start de volledige lokale dev omgeving (emulators, app, test users)"
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

### 3. Start App (background)

```bash
nx serve app
```

Start met `run_in_background: true`.

### 4. Seed de database

```bash
FIREBASE_PROJECT_ID=codeheroes-test nx seed database-seeds
```

### 5. Maak test logins aan in Auth emulator

Voor elke test user, maak een Google Sign-In account aan via de Auth emulator REST API.

**BELANGRIJK**: Begin elk bash commando direct met `curl` (niet met comments of variabelen). Dit matcht met de `Bash(curl:*)` allow rule en voorkomt permissie prompts.

Test users om aan te maken:

| Naam | Email | Google Sub ID | Firestore Doc ID |
|------|-------|---------------|------------------|
| Cassshh | cas.van.dinter@framna.com | cas-google-id-123 | 1000003 |
| Nightcrawler | michael.schilling@framna.com | mschilling-google-id | 1000002 |
| Guido | guido.van.vilsteren@framna.com | guido-google-id | 1000004 |
| Nick | nick.ratering@framna.com | nick-google-id | 1000005 |

Voor elke user, gebruik `python3` om de URL-encoded id_token te genereren, en `curl` direct daarna:

```bash
curl -s -X POST "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=AIzaSyAivW24kx9tKnO8yxjEv51bKF2fPHipjlw" \
  -H "Content-Type: application/json" \
  -d "{\"requestUri\": \"http://localhost:9099/emulator/auth/handler?providerId=google.com&id_token=$(python3 -c "import urllib.parse, json; print(urllib.parse.quote(json.dumps({'sub': 'USER_GOOGLE_SUB_ID', 'email': 'USER_EMAIL', 'name': 'DISPLAY_NAME', 'picture': 'https://github.com/USERNAME.png?size=200', 'email_verified': True, 'iss': '', 'aud': '', 'exp': 0, 'iat': 0})))")\", \"sessionId\": \"ValueNotUsedByAuthEmulator\", \"returnSecureToken\": true, \"returnIdpCredential\": true}"
```

Het `localId` in de response is de Firebase Auth UID. Bewaar deze voor stap 6.

### 6. Koppel Firestore users aan Auth users

Update elk user document met het Firebase Auth UID. Begin direct met `curl`:

```bash
curl -s -X PATCH "http://localhost:8080/v1/projects/codeheroes-test/databases/(default)/documents/users/USER_DOC_ID?updateMask.fieldPaths=uid" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer owner" \
  -d '{"fields": {"uid": {"stringValue": "FIREBASE_AUTH_UID"}}}'
```

### 7. Open pagina's in browser

**ALTIJD** aan het eind de belangrijkste pagina's openen in Chrome via DevTools MCP:

```
mcp__devtools-mcp__new_page  url="http://localhost:4000"
mcp__devtools-mcp__new_page  url="http://localhost:4201"
```

Dit opent:
1. **Emulator UI**: http://localhost:4000
2. **Activity Wall**: http://localhost:4201

---

## Programmatisch inloggen in Activity Wall (zonder popup)

Om in te loggen in de Activity Wall zonder door de Google popup te klikken, gebruik DevTools MCP om de volgende JavaScript uit te voeren op http://localhost:4201:

```javascript
async () => {
  const apiKey = 'AIzaSyAivW24kx9tKnO8yxjEv51bKF2fPHipjlw';

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
