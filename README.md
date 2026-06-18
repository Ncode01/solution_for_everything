# RCCS OS

## Apple-Caliber UI System Pass

RCCS OS now includes a Liquid Glass-inspired interface system built with local CSS and React components. Glass is used selectively for app chrome, navigation, command surfaces, inspectors, modals, and filter bars; data-heavy operational content stays on solid or strong surfaces for readability.

**Design-system additions:**
- CSS tokens for app background, glass/solid surfaces, borders, semantic colors, radii, shadows, motion, and z-index
- Reduced transparency, reduced motion, and higher contrast fallbacks
- Shared primitives: GlassPanel, SolidPanel, FloatingBar, SegmentedControl, LiquidButton, LiquidInput, StatCapsule, AttentionRow, PersonToken, and StatusDot
- Polished RCCS OS glass rail sidebar and floating command topbar
- Rolling 60-day Calendar grid: previous 30 days, today, next 30 days
- Studio-style Launches pipeline and Event-Day Now / Next / Problems cockpit strip

The internal operating system for the Royal College Computer Society. Built for real project tracking, deadline management, team coordination, launches, money, people, approvals, and event-day operations.

## Final Phase — RCCS OS Complete

RCCS OS is ready for real internal RCCS testing. This phase completed remaining gaps: project templates, activity auto-logging, deliverables in calendar, slide-over inspectors, role-aware navigation, handover reports, and Event-Day Mode from Project Overview.

**Final phase additions:**
- **Project Templates** — 8 templates (Blank, ICT Day, Workshop, Outreach, Software, Publication, Hackathon, Internal System) prefill phases, milestones, deliverables, tasks, launches, and event-day checklists
- **Activity Timeline** — auto-logged on mutations (tasks, launches, sponsors, approvals, deliverables, event-day, reports, etc.)
- **Handover Reports** — Library → Handover and Project Overview → Generate Handover (17-section comprehensive report)
- **Slide-over Inspectors** — Task, Deliverable, Launch, Sponsor, Person, Approval, Meeting, Calendar Day
- **Role-aware navigation** — sidebar and route guards by role (Super Admin sees all; Member simplified; Viewer limited)
- **Calendar** — deliverables, approvals, payments, event-day items; Deliverable filter; owner filter
- **Supabase activity_items** — sync on insert when Supabase mode is configured (local fallback unchanged)

## Phase Six — Current State (RCCS OS)

Phase Six transformed RCCS Command Center into **RCCS OS** — a calm, polished, Apple-caliber internal operating system. Navigation has been simplified, product language has been clarified, and major new modules added.

**Key changes in Phase Six:**
- Product renamed to **RCCS OS** throughout the UI
- Simplified sidebar navigation (Today, Focus, Calendar, Projects, Launches, Meetings, Approvals, People, Money, Library, System, Event Day)
- **Today** replaces Dashboard (Needs Attention, Due Today, This Week, Project Health, Recent Activity)
- **Focus** replaces My Work (user-specific work, assignments, approvals)
- **Launches** replaces PR Planner (launch items, copy caption, approval workflow)
- **People** replaces Members (workload visibility, people balance)
- **Library** consolidates Reports, Files & Links, Audit Trail, Archives
- **System** consolidates Data Tools, health, auth, database, deployment
- **Event-Day Mode** (`/event-day`) — live checklist for BTUI, SparkIT, PROTOX
- **Command Menu** (Ctrl/Cmd+K) — global search and quick actions
- **Project Timeline tab** replaces Milestones tab (phases + milestones + deliverables)
- **Deliverables** as a first-class concept linked to projects
- **Activity Timeline** — append-only human-readable activity log
- All old routes redirect: `/dashboard→/today`, `/pr-planner→/launches`, `/budget→/money`, `/members→/people`, `/reports→/library`, `/audit→/library?section=audit`, `/data-tools→/system`

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

**Demo login (Local Demo Mode only)**:
- Username: `admin` / Password: `admin123`
- Username: `secretary` / Password: `rccs2026`
- Username: `member` / Password: `member123`

> **Warning**: Demo auth stores passwords in plaintext and is only active when Supabase env vars are NOT set. In Supabase mode, use your email and password via Supabase Auth.

---

## Supabase Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
supabase login
```

### 2. Link to your project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Create environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Push schema to Supabase

```bash
npm run supabase:db:push
```

### 5. Generate TypeScript types

```bash
npm run supabase:types
```

---

## App Behaviour

| Env vars set? | Mode            | Data source         |
|---------------|-----------------|---------------------|
| No            | Local Demo Mode | localStorage        |
| Yes           | Supabase Mode   | Supabase PostgreSQL |

The mode is shown in the sidebar footer and System page.

---

## Navigation (Phase Six)

| Section      | Page          | Route         |
|--------------|---------------|---------------|
| Overview     | Today         | /today        |
| Overview     | Focus         | /focus        |
| Overview     | Calendar      | /calendar     |
| Overview     | Projects      | /projects     |
| Operations   | Launches      | /launches     |
| Operations   | Meetings      | /meetings     |
| Operations   | Approvals     | /approvals    |
| People&Money | People        | /people       |
| People&Money | Money         | /money        |
| Records      | Library       | /library      |
| Admin        | Event Day     | /event-day    |
| Admin        | System        | /system       |

---

## Event-Day Mode

At `/event-day` — select any project to see its live event checklist. BTUI and SparkIT have pre-seeded checklists. Supports:
- Status updates (Not Ready → Ready → In Progress → Completed / Problem)
- Priority highlighting (Critical items shown prominently)
- Problem items shown in a red alert section
- Copy event-day summary to clipboard
- Print checklist for offline use
- Assign owners using MemberSelect

---

## Project Timeline & Deliverables

Project Detail has been updated to include a **Timeline** tab:
- Phases — top-level project phases with progress bars
- Milestones — key checkpoints within phases
- Deliverables — typed outputs (posters, videos, forms, reports, etc.) with status tracking

Deliverable types: Poster, Video, Caption, Sponsor Proposal, Registration Form, Agenda, Certificate Set, Report, Website Page, Quiz Set, Resource Pack, Other

---

## Library

`/library` consolidates:
- **Reports** — generate, save, copy, print project reports
- **Files & Links** — all file links across projects, searchable
- **Audit Trail** — technical audit log (Supabase or local)
- **Archives** — completed/archived projects

---

## Command Menu

Press **Ctrl+K** (or **Cmd+K** on Mac) anywhere to open the command palette. Supports:
- Navigate to any page instantly
- Quick actions: New Project, New Launch, New Meeting, etc.
- Search projects and people by name

---

## 30-Day Calendar Grid

Default calendar is a 30-day grid. Each cell shows tasks, milestones, PR/launch posts, meetings, and sponsor follow-ups. Toggle between Grid and Agenda views.

---

## Member Selectors

All person assignment fields (assignee, reviewer, owner, designer, etc.) use `MemberSelect` or `MultiMemberSelect` backed by the People list.

---

## Scripts

```bash
npm run dev             # Start dev server
npm run build           # Production build
npm run preview         # Preview production build

npm run supabase:start  # Start local Supabase
npm run supabase:types  # Generate TypeScript types
npm run supabase:db:reset  # Reset local DB (DANGEROUS on remote)
npm run supabase:db:push   # Push migrations to linked project
npm run supabase:status    # Show local Supabase status
```

---

## Project Structure

```
src/
  types/         TypeScript data types (Phase One–Six)
  data/          Seed data (seedData, seedPhaseTwo, seedPhaseSix)
  lib/           Utilities (storage, auth, dateUtils, stats, supabaseClient, attention, audit)
  components/    Shared UI components
  features/
    auth/          Login page
    today/         Today (was Dashboard)
    focus/         Focus (was My Work)
    projects/      Projects list, detail, forms, timeline
    launches/      Launches (was PR Planner)
    calendar/      30-day calendar grid
    meetings/      Meetings
    budget/        Money (budget, sponsors, transactions)
    people/        People (was Members)
    approvals/     Approvals
    library/       Library (reports, files, audit, archives)
    system/        System (was Data Tools)
    event-day/     Event-Day Mode
  state/         AppDataContext, AuthContext
  styles/        Global CSS
supabase/
  migrations/    SQL migrations (Phases 1–6)
  seed.sql       Seed data for Supabase
```

---

## Known Limitations

- Hardcoded auth remains as local demo fallback only (Supabase Auth is production).
- Real-time sync not implemented — page refresh needed to see others' changes.
- File storage uses URL links; no actual file upload (Supabase Storage not wired).
- Activity timeline is local only; Supabase `activity_items` table migration exists but adapter not wired.
- Project templates UI not yet implemented (planned for Phase Seven).
- Inspector panels exist as modal-based inspectors for most entities.
