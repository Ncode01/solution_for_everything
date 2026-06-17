# Known Issues & Limitations

## Auth (temporary)
- Hardcoded plaintext users in `src/lib/auth.ts`. No JWT, no hashing, no server validation.
- Roles are display-only — every logged-in user can access every module. **Not secure.** Replace before any real deployment.

## Data persistence
- All data lives in browser **localStorage** only.
- Not synced across devices or browsers; clearing browser storage loses everything.
- Backup relies entirely on **Data Tools → Export JSON**. Encourage regular exports.

## Functional gaps
- Calendar is agenda/list style only (no month/week grid).
- No real file uploads — File Links are external URLs only.
- Reports are plain text (copy/print/save); no PDF export or charts.
- "Convert action item → task" creates a task but does not deep-link back into the meeting.
- Global search is simple substring matching, not fuzzy/ranked.
- No notifications — the Attention Center is in-app only (no email/push).
- No data migration/versioning: importing an old export from a future schema change may drop unknown fields.

## Scale
- Built for a student society's handful of concurrent projects. Large datasets (hundreds of records) are untested and may feel slow since everything is in memory.

## Phase Three fixes
See `docs/08_IMPLEMENTATION_PLAN.md` for the planned Supabase migration that addresses auth, persistence, and notifications.
