# Changelog

## Workflow Cleanup & Firebase Finish - June 18, 2026

- Collapsed Focus into one general personal queue so tasks, launches, approvals, meetings, and sponsor follow-ups appear in one container with relevant tags instead of repeated empty panels.
- Rebuilt Launches into exactly three operational lanes: Sent to Designer, Under Approval, and Ready to Share.
- Reworked Money from the ground up with overview, expense, and income views; expense ownership; a dedicated quotation and seller owner field; and direct quotation / receipt links that open the source document.
- Updated People roster groups to always show every person without hidden overflow.
- Softened Event Day checklist styling so critical items use calmer badges instead of loud full-row color blocks.
- Removed leftover Supabase runtime artifacts from `src/` so Firebase is the only active backend path in the app code.
- Verified with `npm run build` and in-browser QA for Focus, Launches, Money, People, and Event Day.

## Midnight Graphite Royal Redesign - June 18, 2026

- Replaced the app palette with a midnight graphite and royal-blue Liquid Glass system in `src/styles/global.css`, including calmer surfaces, restrained glow, and updated controls.
- Added shared layout primitives under `src/components/layout/` for screen-specific shells: `ScreenCanvas`, `CommandHero`, queues, pipelines, ledgers, matrices, Finder-style layout, settings rows, and the live cockpit.
- Restyled the shell in `src/components/Sidebar.tsx`, `Topbar.tsx`, `CommandMenu.tsx`, `Modal.tsx`, `SlideOver.tsx`, and refreshed badges/tokens for the new dark graphite language.
- Rebuilt Today, Focus, Projects, Launches, Money, People, Library, System, and Event-Day around screen-specific layouts instead of repeated card grids.
- Updated Calendar framing to use the new command-hero and floating filter grammar while preserving the rolling 60-day logic.
- Verified the redesign with `npm run build`.

## Apple-Caliber UI/UX Transformation - June 18, 2026

- Added RCCS OS design tokens and Liquid Glass-inspired CSS material classes with reduced motion, reduced transparency, and contrast fallbacks.
- Added reusable design primitives under `src/components/design/`.
- Redesigned app shell: glass rail sidebar, floating command topbar, polished login, command menu, attention/search surfaces, modals, and slide-overs.
- Converted Calendar from a month grid to a rolling previous-30/today/next-30 operating window with aligned weekday grid.
- Upgraded Launches into a five-lane publishing pipeline.
- Added People workload/availability rails and shared `PersonToken` identity display.
- Added Event-Day Now / Next / Problems cockpit strip.
- Updated Today hero command strip, stat capsules, mobile row behavior, and overall surface hierarchy.
- Verified with `npm run build` and Playwright screenshots for login, Today, Calendar, Launches, Money, People, Library, System, Event-Day, and mobile Today.

## Final Phase — June 17, 2026

### Completion & Polish
- **Project Templates** — 8 templates with prefilled phases, milestones, deliverables, tasks, launches, event-day items (`src/lib/projectTemplates.ts`)
- **Activity auto-logging** — all major mutations log human-readable activity; Supabase insert when connected (`src/lib/activityLog.ts`, `src/lib/supabaseActivity.ts`)
- **Handover Report generator** — 17-section report in Library → Handover and Project Overview (`generateHandoverReport` in `src/lib/report.ts`)
- **Slide-over Inspectors** — Task, Deliverable, Launch, Sponsor, Person, Approval, Meeting, Calendar Day (`src/components/SlideOver.tsx`, `src/components/inspectors/`)
- **Role-aware navigation** — sidebar filtering and route guards by role (`src/lib/navigationAccess.ts`, `src/components/RoleGuard.tsx`)
- **Calendar deliverables** — deliverables, approvals, payments, event-day items; Deliverable filter; member filter
- **Project Overview polish** — Next Action, health explanation, recent activity/decisions, Event-Day Mode button, handover quick action
- **Event-Day from Overview** — Open/Start Event-Day Mode for event-like projects
- Docs updated across README, AGENTS, architecture, known issues, testing checklist

## Phase Six — June 17, 2026

### Product Transformation: RCCS Command Center → RCCS OS

#### Product Language & Navigation
- **App renamed to RCCS OS** throughout the UI (sidebar branding, login page context)
- **Sidebar** simplified to final navigation: Today, Focus, Calendar, Projects (Overview) · Launches, Meetings, Approvals (Operations) · People, Money (People & Money) · Library (Records) · Event Day, System (Admin)
- **All compatibility redirects** added: `/dashboard→/today`, `/my-work→/focus`, `/pr-planner→/launches`, `/budget→/money`, `/members→/people`, `/reports→/library`, `/files→/library`, `/audit→/library?section=audit`, `/data-tools→/system`, `/settings→/system`, `/sponsors→/money`

#### New Pages
- **Today** (`/today`) — replaces Dashboard. Sections: Needs Attention, Due Today, This Week, Project Health, Recent Activity. Calmer, more actionable layout.
- **Focus** (`/focus`) — replaces My Work. Shows only the logged-in user's assigned tasks, launches, meeting actions, approvals, and sponsor follow-ups.
- **Launches** (`/launches`) — replaces PR Planner. Product language updated to "launch items". Status boards (Needs Approval, Ready to Publish, In Design, Scheduled). Copy caption workflow preserved.
- **People** (`/people`) — replaces Members. Adds People Balance section (committee distribution, high-workload alerts). Full member detail modal.
- **Library** (`/library`) — consolidates Reports, Files & Links, Audit Trail, and Archives into tabbed view. Reports: generate/save/copy/print. Files: search/filter/add. Audit: scrollable trail. Archives: completed/archived projects.
- **System** (`/system`) — consolidates Data Tools, app health, auth info, database record counts, security summary, backup/restore, deployment notes.
- **Event-Day Mode** (`/event-day`) — RCCS-specific live event checklist. Select project, manage checklist items by category (Agenda, Guest, Registration, AV, Certificates, Refreshments, Stage, Media, Logistics, Emergency). Status updates, priority highlighting, problems section, copy summary, print checklist. MemberSelect for owner assignment.

#### Project Detail Changes
- **Timeline tab** replaces Milestones tab — shows Phases, Milestones, and Deliverables in one tab
- **Launches tab** replaces PR Plan tab — same functionality, renamed product language
- **Deliverables** section added to Timeline tab — create, edit, delete project deliverables with type and status tracking

#### New Components
- **CommandMenu** — Ctrl/Cmd+K global command palette. Navigate to any page, search projects and people, trigger quick actions. Keyboard navigable (↑↓, Enter, Escape).
- **Topbar** updated with Ctrl+K button indicator

#### New Types (Phase Six)
- `Deliverable` — project deliverable with type, status, owner, due date, optional file/approval link
- `DeliverableType` — 12 types (Poster, Video, Caption, Sponsor Proposal, Registration Form, Agenda, Certificate Set, Report, Website Page, Quiz Set, Resource Pack, Other)
- `DeliverableStatus` — 8 statuses (Not Started, Drafting, In Review, Changes Requested, Approved, Published, Completed, Archived)
- `EventDayItem` — event-day checklist item with category, status, priority, scheduled time, owner
- `ActivityItem` — human-readable activity log entry (append-only, max 200 items locally)
- `UserRole` extended with Project Admin, Team Lead, Viewer

#### Data Layer
- `DATA_VERSION` bumped to **4**
- `AppData` extended with `deliverables`, `eventDayItems`, `activityItems` collections
- New localStorage keys: `rccs_deliverables`, `rccs_event_day_items`, `rccs_activity_items`
- `AppDataContext` extended with `saveDeliverable`, `deleteDeliverable`, `saveEventDayItem`, `deleteEventDayItem`, `addActivity`
- `SponsorDeliverableStatus` renamed from `DeliverableStatus` (was: Not Started/In Progress/Delivered/Cancelled) to avoid conflict

#### Seed Data
- `src/data/seedPhaseSix.ts` — BTUI and SparkIT deliverables (12 items) and event-day checklists (14 items)

#### Supabase Migrations
- `supabase/migrations/20260617000006_phase_six_tables.sql` — creates `deliverables`, `event_day_items`, `activity_items` with RLS policies

#### attention.ts
- Routes updated from `/pr-planner` → `/launches`, `/budget` → `/money`
- Group labels updated to say "Launches" instead of "PR items"

#### Build
- `npm run build` passes with zero TypeScript errors
- All new routes lazy-loaded except Today, Focus, Projects (eagerly loaded)

---

## Phase Five — June 17, 2026

### Added
- **Supabase Auth integration** (`src/state/AuthContext.tsx`): `AuthProvider` with `useAuth()` hook. Supabase mode uses `supabase.auth.signInWithPassword()` and `onAuthStateChange()`. Local demo mode falls back to hardcoded credentials from `src/lib/auth.ts`. No crash when env vars are missing.
- **Profile-not-found screen**: If a Supabase user has no linked profile row, a clear "Profile Not Linked" screen is shown with the auth user UUID and admin instructions.
- **`AuthDataBridge` component**: Keeps audit actor ID in sync between `AuthContext` and `AppDataContext`.
- **`project_members` table** (`20260617000002_project_members.sql`): Links profiles to projects with project roles (Project Admin, Team Lead, Contributor, Viewer) for RLS.
- **RLS helper functions** (`20260617000003_rls_helpers.sql`): `current_profile_id()`, `current_user_role()`, `is_super_admin()`, `is_executive_or_above()`, `can_manage_project()`, `is_project_member()`, `can_write_finance()`.
- **Production RLS policies** (`20260617000004_rls_production.sql`): Drops permissive Phase Four MVP policies. Implements role-aware, project-scoped policies for all 19 tables. No anonymous write access.
- **`audit_logs` table** (`20260617000005_audit_log.sql`): Append-only audit trail. RLS prevents updates/deletes; insert allowed for authenticated users; admins and project managers can read.
- **`src/lib/audit.ts`**: `logAudit()` function. In Supabase mode inserts to `audit_logs`; in local mode appends to localStorage (capped at 500). Never throws — audit failures are console-warned.
- **Audit logging in AppDataContext**: All save/delete operations for projects, members, meetings, sponsors, transactions, approvals, file links, and reports now emit audit log entries.
- **Audit Log page** (`src/features/audit/AuditLogPage.tsx`): Route `/audit`. Filters by type, project, and search. Shows actor, action, entity type, summary, and timestamp. Skeleton loading states.
- **`src/components/PageLoader.tsx`**: Full-screen loading placeholder used for route lazy loading and initial auth check.
- **Code splitting**: All non-critical routes are lazy-loaded via `React.lazy` + `Suspense`. Separate chunks: Calendar, PRPlanner, Members, Meetings, Budget, Approvals, Reports, DataTools, AuditLog.
- **`docs/13_DEPLOYMENT_RUNBOOK.md`**: Full deployment guide for Cloudflare Pages/Vercel, pre-deployment checklist, admin setup steps, RLS verification SQL.
- **`supabase/dev_link_profiles_example.sql`**: Local-dev helper to link `profiles.auth_user_id` to auth user UUIDs.

### Changed
- **`src/App.tsx`**: Uses `useAuth()` instead of local `getSession()`. Shows `PageLoader` during auth initialization. Lazy imports for 9 routes.
- **`src/main.tsx`**: Wraps with `AuthProvider`; renders `AuthDataBridge`.
- **`src/features/auth/LoginPage.tsx`**: Uses `useAuth().login()`. Detects Supabase vs local mode and shows appropriate field labels and mode badge. Shows profile-not-found screen. Demo credentials hidden in Supabase mode.
- **`src/components/Topbar.tsx`**: Added connection mode indicator icon; expanded role icons for all 6 role types.
- **`src/components/Sidebar.tsx`**: Added Audit Log nav item. Bumped version to v5.0.0.
- **`src/features/settings/DataToolsPage.tsx`**: Added provider health check panel (Database, Authentication, Profile Linked). Reset action now emits audit log.
- **`src/state/AppDataContext.tsx`**: All CRUD operations emit audit log entries via `logAudit`. Added `setActorId()` for audit actor tracking.
- **`src/types/supabase.ts`**: Added `project_members` and `audit_logs` table types.
- **`supabase/README.md`**: Updated with Phase Five migrations, admin setup steps, RLS policy summary.

### Security
- All anonymous write access removed via production RLS policies.
- Finance tables (sponsors, budgets, transactions) require project manager role to write.
- Audit log is append-only (no update/delete policies).
- Hardcoded auth remains local demo fallback only.

---

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
# 2026-06-18

## Firebase migration + workflow pass

- Migrated the active backend path to Firebase Auth + Firestore + Firebase Hosting
- Added `src/lib/firebaseClient.ts`, `src/lib/firebaseDataProvider.ts`, `src/lib/firebaseSeed.ts`, `firebase.json`, `.firebaserc`, `firestore.rules`, and `firestore.indexes.json`
- Preserved local demo fallback while wiring `AppDataContext` save/load flows to Firestore when authenticated
- Fixed Focus member resolution so it no longer guesses or falls back to the first person
- Added reusable list limiting with `src/components/layout/ViewAllButton.tsx`
- Reshaped Launches into a clearer workflow board and action queue
- Moved Approvals edit/delete actions behind a quieter more-actions menu
- Added external organization metadata for People and grouped roster chips by organization
- Improved Money sheets and quotation clarity
- Streamlined Event-Day problem visibility and one-tap status handling
- Updated environment, runtime labels, and deploy scripts for Firebase / FlowCanvas
