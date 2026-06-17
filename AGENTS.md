# AGENTS.md — RCCS Command Center AI Agent Rules

This file governs how AI coding agents should work on this project.

## Phase Four Rules (current phase)

The app now supports both Local Demo Mode (localStorage) and Supabase Connected Mode (PostgreSQL).

1. **Supabase is now integrated**. Use `src/lib/supabaseClient.ts` and `src/lib/dataProvider.ts` for database access. Do not bypass the data provider.
2. **Do not add any paid service** (no paid APIs, no paid SDKs, no paid cloud services).
3. **No real backend REST API** — Supabase handles data directly from the frontend via the JS client.
4. **localStorage is the fallback** when Supabase env vars are not configured. The app must never crash if env vars are missing.
5. **Keep components readable** — prefer simple, obvious code over clever abstractions.
6. **Do not add global state libraries** (Redux, Zustand, etc.). App state lives in `src/state/AppDataContext.tsx` (React Context only).
7. **Do not build features marked "Out of Scope"** without explicit instruction.
8. **Document changes** in CHANGELOG.md and `docs/09_PROMPT_LOG.md` after significant work.
9. **No fake/dead pages** — every screen and button must do something real.
10. **Internal person fields must use MemberSelect** — never use a plain text input for RCCS member assignment, ownership, reviewer, designer, etc. Use `src/components/MemberSelect.tsx` or `src/components/MultiMemberSelect.tsx`.
11. **Calendar default is 30-day grid** — do not change the default calendar view to agenda without explicit instruction.
12. **Supabase CLI migrations live in `supabase/migrations/`** — all schema changes must go through migration files, not ad-hoc SQL.
13. **Supabase types live in `src/types/supabase.ts`** — regenerate with `npm run supabase:types` after schema changes.

## Project Workspace Rules (Phase Three)

10. **Project Detail must stay at 7 tabs**: Overview · Milestones · Tasks · PR Plan · Meetings · Money · Approvals. Do NOT re-add Phases, Reports, Files, or Sponsors as separate tabs without explicit request.
11. **Sponsors belong inside the Money workflow**. Do not create a standalone Sponsors page or sidebar link. All sponsor management goes through the Money tab (Project Detail) or the global Money & Sponsors page (`/budget`).
12. **The `/sponsors` route must redirect to `/budget`**. Do not remove or change this redirect.
13. **Reports are actions/outputs, not daily tabs**. Report generation is a quick action in Project Overview and available on the global Reports page. Do not re-add a Reports tab to Project Detail.
14. **File links are contextual**. All file links are shown in Overview. Finance file links are also shown in Money tab. PR file links are also shown in PR Plan tab. Do not re-add a Files tab.

## Data Version Rules

15. **Always bump `DATA_VERSION`** in `src/lib/storage.ts` when making breaking changes to the AppData schema.
16. **Current DATA_VERSION = 3**. All new schema additions that could break existing localStorage data must increment this.
17. **`saveAppData` and `resetToSeedData` must write the version key** (`rccs_data_version`). Do not remove this behaviour.

## UI Consistency Rules

Reuse the shared components instead of re-styling per page:

- `PageHeader` — page title, description, primary actions
- `SectionHeader` — section titles with optional count/tone
- `Card` — standard surface (`bg-slate-900 border border-slate-800 rounded-xl`)
- `StatusBadge` — soft, bordered badges; add new statuses to its `COLOR_MAP`
- `Field` / `FormActions` — consistent form fields and submit/cancel rows
- `ConfirmDialog` — all destructive actions must confirm
- `QuickAddMenu` — quick-create dropdowns
- Use `formatCurrency` (Rs / LKR) and `dateUtils` helpers for formatting

Keep the calm, structured, deadline-focused dark-navy look. Avoid gradient soup and decorative clutter.

## Data Model Rules

- All Phase Two collections are **top-level arrays** in `AppData` (`src/types/index.ts`), stored under separate `localStorage` keys via `src/lib/storage.ts`.
- Records reference projects/members by id (e.g. `projectId`). Phase One nested arrays (phases/milestones/tasks/prItems inside Project) are unchanged.
- All reads/writes go through `useAppData()` CRUD helpers — do not write `localStorage` directly from components.
- Export/import/reset live in `src/lib/storage.ts`. Import must validate input and never crash on bad data.

## Auth Warning

The current auth in `src/lib/auth.ts` is **temporary hardcoded MVP auth only**.

- Passwords are stored in plaintext.
- There is no real session token or JWT.
- There is no server-side validation.
- This **must be replaced** before any real deployment or when user data becomes sensitive.

Do not build on top of this auth system. When Phase Two begins, replace it with Supabase Auth or a proper provider.

## localStorage Warning

All project data is stored in the browser's localStorage under the key `rccs_projects`.

- Data is not synced across devices.
- Data is lost if the user clears browser storage.
- There is no backup or restore mechanism (other than the Reset Demo Data button).

When Phase Two begins, migrate to a real database.

## Approved Folder Structure

```
src/
  types/         — TypeScript data types only
  data/          — Seed data
  lib/           — Utility functions (storage, auth, dateUtils, stats)
  components/    — Shared UI components
  features/
    auth/        — Login page
    dashboard/   — Dashboard
    projects/    — Projects list, detail, and forms
    pr/          — PR Planner and PR item form
    calendar/    — Calendar/agenda view
  styles/        — Global CSS
```

Do not create new feature folders without discussion.

## Do Not

- Do not delete the PRD file (`RCCS Product Requirements (1).md`).
- Do not replace documentation with vague summaries.
- Do not introduce backend files.
- Do not add real secrets or API keys to any file.
- Do not remove the MVP auth warning comment from `src/lib/auth.ts`.
