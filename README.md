# RCCS OS

RCCS OS is the internal operating system for Royal College Computer Society work: projects, launches, meetings, approvals, people, money, library records, and event-day coordination.

## Runtime modes

- `Firebase Connected`: Firebase Auth + Cloud Firestore + Firebase Hosting
- `Local Demo Mode`: browser-only fallback when Firebase env vars are missing

Active Firebase project:

- Display name: `FlowCanvas`
- Project ID: `flowcanvas-live`

## Local development

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env.local` and fill in your Firebase web app config:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=flowcanvas-live
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

## Authentication

- Firebase mode uses Firebase Auth email/password
- Local demo mode uses the built-in demo usernames shown on the login screen
- Focus and login-linked workflows map users to People profiles through `authUserId`, `username`, email, and exact-name fallbacks

## Data model

- Firestore stores one document per top-level collection item
- `projects/{projectId}` keeps nested `phases`, `milestones`, `tasks`, and `prItems`
- Local demo mode still uses the existing seeded `localStorage` path

## Firebase commands

```bash
npm run firebase:projects
npm run firebase:emulators
npm run firebase:deploy
npm run firebase:deploy:hosting
npm run firebase:deploy:rules
```

## Hosting

Firebase Hosting is configured with:

- `firebase.json`
- `.firebaserc`
- `firestore.rules`
- `firestore.indexes.json`

SPA routes rewrite to `index.html`.

## Build

```bash
npm run build
```

## Notes

- Local demo auth is still intentionally simple and not production-grade
- Firestore rules currently allow authenticated users to read/write app data and should be tightened later by role or collection
- Firebase is now the only active backend path in the app runtime
