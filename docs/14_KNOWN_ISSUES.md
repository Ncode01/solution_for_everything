# Known Issues & Limitations

## UI / UX Limitations

- The Apple-caliber pass establishes the system and upgrades the primary chrome/screens, but some older inner table/list sections still use legacy markup while inheriting the new tokens.
- Browser MCP was unavailable during this pass due to a locked profile, so visual QA used Playwright CLI screenshots instead.
- The main bundled chunk remains above Vite's 500 kB warning threshold; this predates the visual pass and can be addressed with deeper route/component splitting.

## Remaining (honest)

### Data persistence (local mode)
- When Supabase env vars are not set, all data lives in **localStorage** only — not synced across devices.
- Full Supabase **read/write sync for all collections** is not implemented; only auth, audit logs, and activity_items insert are wired to Supabase. Projects, tasks, sponsors, etc. still use localStorage even in Supabase mode until a full data provider migration is completed.

### Auth & security
- **Local demo mode** uses hardcoded plaintext users in `src/lib/auth.ts` — not production security.
- **Role-aware navigation** is frontend UX only; RLS policies protect Supabase data but local mode has no server-side enforcement.
- Link `profiles.auth_user_id` to Supabase Auth users before production (see `docs/05_AUTH_SECURITY_RLS.md`).

### Functional
- No real file uploads — File Links are external URLs only.
- Reports and handover are plain text (copy/print/save); no PDF export.
- No email/push notifications — attention is in-app only.
- No real-time Supabase subscriptions — data does not live-update across browser tabs.
- Global search is simple substring matching, not fuzzy/ranked.

### Scale
- Built for a student society's handful of concurrent projects. Large datasets are untested.

## Fixed in Final Phase
- ~~Project Templates not implemented~~ — 8 templates in project creation flow
- ~~Activity auto-logging not wired~~ — mutations log to activity timeline
- ~~activity_items Supabase adapter missing~~ — insert sync via `src/lib/supabaseActivity.ts`
- ~~Deliverables not in Calendar~~ — deliverables appear in grid and agenda
- ~~Event-Day button missing from Project Overview~~ — Open/Start Event-Day Mode added
- ~~Role-aware nav not implemented~~ — sidebar filtering + route guards
- ~~Handover report not implemented~~ — Library Handover section + Project Overview
- ~~Slide-over inspectors missing~~ — SlideOver + entity inspectors added

## Auth (local demo only)
- Demo logins: `admin/admin123`, `secretary/rccs2026`, `member/member123`
- Roles: Super Admin, Executive Admin, Member (demo). Viewer role supported in nav rules but no demo login.

## Supabase production checklist
1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Run migrations: `npm run supabase:db:push`
3. Link auth users to profiles (`supabase/dev_link_profiles_example.sql`)
4. Verify RLS with non-admin test accounts
5. Plan full data provider migration for multi-device sync
