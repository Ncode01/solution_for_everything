# Architecture — RCCS Command Center (Phase Two)

## App Structure

```
src/
  main.tsx                 — Entry point; wraps app in <AppDataProvider>
  App.tsx                  — Auth gate + routing
  types/index.ts           — All TypeScript types (Phase One + Phase Two)
  data/
    seedData.ts            — Phase One seed projects
    seedPhaseTwo.ts        — Members, sponsors, budgets, transactions, meetings, approvals, files
  state/
    AppDataContext.tsx     — React Context holding AppData + CRUD helpers + persistence
  lib/
    auth.ts                — Temporary MVP auth (hardcoded users)
    storage.ts             — localStorage load/save, export/import/reset, last-saved
    dateUtils.ts           — Date + currency formatting helpers
    stats.ts               — Dashboard + budget/sponsor/health helpers
    attention.ts           — Attention Center aggregation
    search.ts              — Global search across entities
    report.ts              — Project report generator
    useAutoNew.ts          — Opens create form when page reached with ?new=1
  components/
    Layout, Sidebar, Topbar, GlobalSearch, AttentionBell
    PageHeader, SectionHeader, Card, StatusBadge, ProgressBar,
    EmptyState, Modal, ConfirmDialog, Field, QuickAddMenu
  features/
    auth/        — LoginPage
    dashboard/   — DashboardPage
    projects/    — ProjectsPage, ProjectDetailPage, ProjectForm, PhaseForm, MilestoneForm, TaskForm
    pr/          — PRPlannerPage, PRItemForm
    calendar/    — CalendarPage
    members/     — MembersPage, MemberForm
    meetings/    — MeetingsPage, MeetingForm
    sponsors/    — SponsorsPage, SponsorForm
    budget/      — BudgetPage, TransactionForm, BudgetForm
    approvals/   — ApprovalsPage, ApprovalForm
    files/       — FilesPanel, FileLinkForm
    reports/     — ReportsPage
    settings/    — DataToolsPage
  styles/global.css
```

## Local-First Data Flow

```
main.tsx → AppDataProvider (loadAppData() from localStorage or seed)
  → useAppData() exposes data + CRUD (saveProject, saveMember, saveMeeting, ...)
  → any CRUD call updates React state AND writes localStorage via saveAppData()
  → pages read data from context; no prop-drilling of the data tree
```

All app state is held in one `AppData` object in `AppDataContext`. No external state library is used (React Context only).

## Storage Flow

```
localStorage keys:
  rccs_projects        rccs_members      rccs_meetings
  rccs_sponsors        rccs_budgets      rccs_transactions
  rccs_approvals       rccs_file_links   rccs_reports
  rccs_seeded          — "true" once seed data has loaded
  rccs_last_saved      — ISO timestamp of last write
  rccs_session         — current logged-in user
```

Each collection has its own key (Phase One `rccs_projects` is unchanged, so existing data survives the upgrade). `loadAppData()` reads all keys; `saveAppData()` writes all keys and updates `rccs_last_saved`.

## Data Tools (Backup / Import)

- **Export** → `exportData()` serializes the full `AppData` to JSON for download.
- **Import** → `parseImportedData()` validates the JSON (each known collection must be an array; missing ones default to empty), then `replaceAll()` swaps state and persists. Invalid files show an error instead of crashing.
- **Reset** → `resetToSeedData()` restores the original seed and re-persists.

## Shared UI Patterns

Pages compose `PageHeader` + filters + `Card`/table lists + `Modal` forms. Forms use `Field`/`FormActions`. Destructive actions use `ConfirmDialog`. Status uses `StatusBadge`. This keeps a consistent layout rhythm across every screen.

## Routing

| Route | Component |
|-------|-----------|
| /dashboard | DashboardPage |
| /projects | ProjectsPage |
| /projects/:id | ProjectDetailPage |
| /calendar | CalendarPage |
| /pr-planner | PRPlannerPage |
| /members | MembersPage |
| /meetings | MeetingsPage |
| /sponsors | SponsorsPage |
| /budget | BudgetPage |
| /approvals | ApprovalsPage |
| /reports | ReportsPage |
| /data-tools | DataToolsPage |
| * | → /dashboard |

Pages support `?new=1` to auto-open their create form (used by dashboard / project quick actions).

## Auth Flow

Unchanged from Phase One. `getSession()` reads localStorage; `LoginPage` calls `login()`; logout clears the session. Still temporary hardcoded MVP auth.
