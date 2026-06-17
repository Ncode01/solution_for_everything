# Known Issues & Limitations

## Phase Six Remaining Items
- **Project Templates** — not yet implemented. Selecting a template when creating a project is planned for Phase Seven.
- **Role-aware navigation hiding** — roles are checked in Focus/Today for member mapping but full navigation hiding by role is not implemented. Frontend-only anyway (RLS handles actual data security).
- **Activity Timeline wire-up** — `activityItems` collection exists and `addActivity` works locally, but mutation hooks (saveProject, saveDeliverable, etc.) don't auto-log to activity yet. A dedicated Phase Seven task.
- **Supabase `activity_items` adapter** — migration exists but `AppDataContext` still uses localStorage for activity. Wire in Phase Seven.
- **Inspector panels** — entity editing happens via modals (which serve as inspectors). Dedicated slide-over inspector panels not implemented; current modal approach is functional.
- **Handover report generation** — Library shows archived projects; full handover summary auto-generation not yet implemented.
- **Deliverables in Calendar** — deliverables with due dates don't yet appear as calendar cells. Planned for Phase Seven.
- **Event Day linked to Project Overview** — "Start Event-Day Mode" button in Project Overview not yet added; use `/event-day?project=ID` directly.



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
