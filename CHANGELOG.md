# Changelog

## Phase Four — June 2026

### Added
- **Supabase CLI integration**: `supabase/config.toml`, `supabase/migrations/`, `supabase/seed.sql` with full RCCS schema.
- **19-table relational database schema**: profiles, projects, phases, milestones, tasks, pr_campaigns, pr_items, meetings, meeting_attendees, meeting_decisions, meeting_action_items, sponsors, sponsor_deliverables, budgets, transactions, approval_requests, file_links, reports, app_settings.
- **RLS policies**: All tables have Row Level Security enabled with documented temporary MVP policies.
- **Supabase client** (`src/lib/supabaseClient.ts`): Conditional client, `isSupabaseConfigured`, `getConnectionMode`, `getConnectionLabel`.
- **Handwritten Supabase TypeScript types** (`src/types/supabase.ts`).
- **Data provider abstraction** (`src/lib/dataProvider.ts`): Facade for connection mode; local and Supabase adapters.
- **MemberSelect component** (`src/components/MemberSelect.tsx`): Searchable dropdown for single member selection.
- **MultiMemberSelect component** (`src/components/MultiMemberSelect.tsx`): Multi-member selector for meeting attendees.
- **Member selectors** applied to all forms: TaskForm, MilestoneForm, PRItemForm, MeetingForm, TransactionForm, ApprovalForm, FileLinkForm, SponsorForm.
- **30-day calendar grid** (`src/features/calendar/CalendarPage.tsx`): Google Calendar-style grid, `+X more` overflow, day detail modal, type filters, project/owner/type filters, grid/agenda toggle.
- **My Work page** (`src/features/my-work/MyWorkPage.tsx`): Shows tasks, PR items, action items, sponsor follow-ups, and approvals assigned to the current user.
- **Toast notifications** (`src/components/Toast.tsx`): `ToastProvider` + `useToast` hook for save/error notifications.
- **CSV export** (`src/lib/csvExport.ts`): `toCSV`, `downloadCSV`, `downloadJSON` utilities; CSV button in Transactions tab.
- **Project pinning**: Pin/unpin projects from the Projects list; pinned projects sort to top.
- **Recently viewed projects**: Recorded on project open, shown in Dashboard footer.
- **Smart missing-info warnings**: Project overview shows amber banner for missing owner, end date, tasks, phases, 0% progress, or unassigned tasks.
- **Connection mode indicator**: Sidebar footer shows Local/Supabase mode; Data Tools page shows full status.
- **`src/lib/recentProjects.ts`**: Utility for tracking recently viewed project IDs.
- **`src/vite-env.d.ts`**: Vite env type references for TypeScript.
- **`.env.example`**: Documents all required environment variables.

### Changed
- **`src/types/index.ts`**: Added optional `*Id` fields (e.g., `ownerId`, `assigneeId`, `reviewerId`) alongside existing string fields for all entities; added `pinned` and `notes` to Project.
- **`src/App.tsx`**: Added `/my-work` route.
- **`src/components/Sidebar.tsx`**: Added "My Work" nav item; added connection mode badge in footer.
- **`src/features/projects/ProjectsPage.tsx`**: Added pin/unpin button; resolved owner names via `resolveMemberName`.
- **`src/features/projects/ProjectDetailPage.tsx`**: Smart missing-info warnings in overview; assignee display uses member IDs.
- **`src/features/dashboard/DashboardPage.tsx`**: Added recently viewed projects section.
- **`src/features/budget/BudgetPage.tsx`**: Added CSV export button to Transactions tab.
- **`src/main.tsx`**: Wrapped app with `ToastProvider`.
- **`src/styles/global.css`**: Added `slide-up` keyframes for toast animation.
- **`package.json`**: Added `@supabase/supabase-js`; added `supabase:types`, `supabase:db:reset`, `supabase:db:push`, `supabase:status`, `supabase:start` scripts.
- **`.gitignore`**: Added Supabase, env, and OS-specific ignores.

### Fixed
- `import.meta.env` TypeScript errors resolved via `src/vite-env.d.ts`.
- `EmptyState` `icon` prop now accepts both `LucideIcon` component and `React.ReactNode`.
- `SponsorForm` now receives `members` prop from `SponsorsPage`.

---

## Phase Three — earlier 2026

- Project detail simplified to 7 tabs: Overview · Milestones · Tasks · PR Plan · Meetings · Money · Approvals.
- Sponsors moved inside Money workflow.
- Project health scoring.
- Data versioning (`DATA_VERSION = 3`).
- Contextual file/report access.
- Improved dashboard, calendar, and search.

## Phase Two — 2026

- Members, meetings, sponsors, budget, approvals, file links, reports/archive.
- Data tools, attention center, global search.

## Phase One — 2025

- Local MVP with hardcoded auth.
- Dashboard, projects, phases, milestones, tasks, PR planner, calendar agenda.
- Seed data for RCCS projects.
