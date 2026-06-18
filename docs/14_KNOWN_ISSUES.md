# Known Issues & Limitations

## Runtime

- Local Demo Mode still stores data only in browser storage and is not shared across devices.
- Firebase mode currently uses broad authenticated Firestore rules for MVP speed; tighter role-based access still needs to be added.
- Firestore sync is load/save based right now and does not yet use real-time subscriptions across tabs or users.

## Auth

- Local demo auth in `src/lib/auth.ts` is still simple plaintext demo auth and is not production security.
- Login-to-person linking depends on `authUserId`, `username`, or email/name fallbacks, so older imported datasets may need manual cleanup for perfect matching.

## Functional

- File links are still external URLs only; there is no first-party file upload workflow yet.
- Reports and handover outputs are still app-native text workflows, not PDF export pipelines.
- Global search is still lightweight substring matching rather than a ranked search system.

## Legacy

- Firebase environment variables still need to be configured before hosted builds can leave Local Demo Mode.
