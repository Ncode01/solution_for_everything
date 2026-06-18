# UI/UX Screens — Phase Two

## Design System

- Dark navy theme: `slate-950` background, `slate-900` cards, `blue-600` primary
- Tailwind CSS utility-first; custom classes `.btn-*`, `.card`, `.input`, `.label`, `.select`, `.textarea`
- Lucide React for icons
- Soft, bordered `StatusBadge` (calm palette); `ProgressBar`
- Shared layout components: `PageHeader` (title + description + actions), `SectionHeader`, `Card`, `Field`/`FormActions`, `ConfirmDialog`, `QuickAddMenu`
- App shell: grouped left sidebar (Overview / Operations / People & Money / Records), collapses to a mobile drawer; topbar has global search, Attention Center bell, user, logout

## Phase Two Screen Patterns

- **Page header**: every page uses `PageHeader` with a clear title, one-line description, and a primary action (often `New …` or `QuickAddMenu`).
- **Filters row**: search + dropdown filters directly under the header.
- **Lists**: `Card` lists or responsive tables (tables get `overflow-x-auto` + `min-w` so they scroll on mobile).
- **Forms**: open in `Modal`, built from `Field` + `FormActions`.
- **Deletes**: always via `ConfirmDialog`.
- **Empty states**: helpful `EmptyState` with a create action.

## New Screens

- **Members** (`/members`): searchable member cards (committee, workload, availability, skills, project/task counts); detail modal; create/edit/delete.
- **Meetings** (`/meetings`): open-action-items panel, type/project filters, meeting cards; detail modal with decisions, action items (toggle done, convert → task), copy summary.
- **Sponsors** (`/sponsors`): totals (confirmed/pipeline/target), stage/payment/project filters, inline stage + payment quick-update, deliverables, follow-up alerts.
- **Budget** (`/budget`): project selector, budget plan vs recorded transactions, surplus, usage %, warnings (over-expense, under-income, missing receipts), transactions table, edit budget.
- **Approvals** (`/approvals`): status/project filters, inline status workflow, comments.
- **Reports** (`/reports`): pick project → generate summary → copy / print / save; saved reports archive.
- **Data Tools** (`/data-tools`): data counts, export/import JSON, reset demo data, last-saved time, localStorage warning.

## Updated Phase One Screens

- **Dashboard**: attention-first. Stat cards, `QuickAddMenu`, grouped Attention Center, Project Health column.
- **Projects**: sortable (deadline/priority/status/progress); cards show health, overdue + pending-approval counts, next deadline.
- **Project Detail**: header with health; **Command Summary** (overdue, PR approvals, approvals, action items, sponsorship, budget surplus, next deadlines); tabs Overview, Phases, Milestones, Tasks, PR, Meetings, Sponsors, Budget, Approvals, Files, Reports; `QuickAddMenu`.
- **PR Planner**: Needs approval / Ready to post / This week sections; copy caption; missing-field warnings.
- **Calendar**: clickable items navigate to source; project filter; meetings shown; Today/This week labels.

## Legacy Phase One reference

## Design System (Phase One)

- Dark navy theme: `slate-950` background, `slate-900` cards, `blue-600` primary
- Tailwind CSS utility-first
- Custom CSS classes: `.btn-primary`, `.btn-secondary`, `.card`, `.input`, `.label`, `.select`
- Lucide React for icons
- StatusBadge component with color-coded status/priority
- ProgressBar component

## Screens

### 1. Login Screen (`/login` → renders from root)

- Centered card with RCCS logo and branding
- Username and password fields
- Error message on failed login
- Demo credentials shown below the form
- Stores session in localStorage on success

### 2. Dashboard (`/dashboard`)

- Welcome message with user's name
- 5 stat cards: Active Projects, Overdue Tasks, Upcoming Deadlines, PR Posts This Week, Pending PR Approval
- Project cards (active/planning projects): name, type, status, priority, progress bar, owner, task count, overdue count, next deadline
- Upcoming Deadlines list (next 14 days, sorted by date)
- Overdue tasks list (if any)
- Pending PR Approval list (if any)
- Reset Demo Data button (danger zone, requires confirmation)

### 3. Projects Page (`/projects`)

- Page title + "New Project" button
- Search input, Status filter, Priority filter
- Project list with: name, type, status, priority, description, owner, task/milestone counts, date range, progress bar
- "Open" button → navigates to project detail

### 4. Project Detail Page (`/projects/:id`)

- Back button, project title, status badge, priority badge
- Edit button → opens edit modal
- Project meta: owner, timeline, final event date, progress
- Description
- Quick stats: phases, milestones, tasks, PR items
- Tabs: Overview | Phases | Milestones | Tasks | PR Plan

**Overview Tab:**
- Upcoming deadlines list
- Overdue tasks list
- Recent PR items

**Phases Tab:**
- Phase cards with status, progress, dates
- Status dropdown per phase
- Edit / Delete buttons
- Add Phase button

**Milestones Tab:**
- Table: name, due date, owner, status dropdown
- Edit / Delete per row
- Add Milestone button

**Tasks Tab:**
- Status and priority filters
- Task rows with: circle checkbox (click to mark done), title, description, assignee, due date
- Status dropdown + priority dropdown per task
- Edit / Delete per task
- Add Task button

**PR Plan Tab:**
- PR item cards: title, platform, campaign, approval status, publishing status, dates, team, caption preview
- Status dropdowns per item
- Add / Edit / Delete PR items

### 5. PR Planner (`/pr-planner`)

- All PR items across all projects
- Filters: search, project, platform, approval status, publishing status
- Sorted by publish date
- Same card layout as Project PR Plan tab
- New PR Item button (requires project selection)

### 6. Calendar (`/calendar`)

- Month navigation (prev/next arrows)
- Filter buttons: All | Tasks | Milestones | PR Posts | Events
- Summary bar showing item counts per type
- Agenda list grouped by date
- Date headers with today highlight and past date indicators
- Each item shows: icon, label, project name, extra info, status badge
- Color-coded by type: blue (tasks), amber (milestones), violet (PR), green (events)

## RCCS OS Liquid Glass-Inspired UI Pass

RCCS OS now uses a calm, spatial, Liquid Glass-inspired design language without copying Apple assets or making content unreadable.

Placement rules:
- Page primary actions live in `PageHeader` actions.
- Section actions live beside `SectionHeader`.
- Filters sit directly above the content they affect, preferably inside a floating control surface.
- Row actions stay at the far right and should not force mobile overflow.
- Destructive actions remain quiet until confirmation.

Screen behavior updates:
- Sidebar is a glass rail with active capsule indicators.
- Topbar is a floating command surface with integrated search, command hint, attention button, connection chip, and profile pill.
- Today opens with a command strip, compact stat capsules, readable attention rows, project health, money, and recent activity.
- Calendar is a rolling 60-day grid: previous 30 days, today, next 30 days. Agenda remains available through segmented control.
- Project Detail keeps exactly seven tabs and uses a sticky segmented control.
- Launches uses a five-lane publishing pipeline plus a detailed filtered work list.
- Money stays mostly solid for finance readability, with glass only for selectors/tabs/header chrome.
- People includes workload/availability rails and standard person tokens.
- Library uses segmented sections for Reports, Files & Links, Audit, Archives, and Handover.
- Event-Day has a Now / Next / Problems cockpit strip above the checklist.

Accessibility:
- Text over glass must remain high contrast.
- Dense operational data should use solid/strong surfaces.
- Reduced transparency, reduced motion, and contrast media queries are defined in `global.css`.
