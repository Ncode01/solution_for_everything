# RCCS Command Center

The internal operations platform for the Royal College Computing Society. Built for real project tracking, deadline management, and team coordination.

## Phase Four — Current State

Phase Four introduced Supabase as the database backend, a 30-day calendar grid, member selectors across all forms, My Work page, UI polish, and several productivity improvements.

The app now supports:
- **Local Demo Mode** (default): localStorage, zero configuration required.
- **Supabase Connected Mode**: full PostgreSQL backend with RLS.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

**Demo login**:
- Username: `admin` / Password: `admin123`
- Username: `secretary` / Password: `sec123`

> **Warning**: This is temporary hardcoded auth. Passwords are plaintext. Do not use in production.

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

Fill in your project values:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Push schema to Supabase

```bash
npm run supabase:db:push
```

### 5. Generate TypeScript types (after linking)

```bash
npm run supabase:types
```

### 6. Local development with Supabase

```bash
npm run supabase:start    # Start local Supabase
npm run supabase:db:reset # Reset to seed data (local only)
npm run supabase:status   # Check local status
```

---

## App Behaviour

| Env vars set? | Mode            | Data source         |
|---------------|-----------------|---------------------|
| No            | Local Demo Mode | localStorage        |
| Yes           | Supabase Mode   | Supabase PostgreSQL |

The mode is shown in the sidebar footer and Data Tools page.

---

## 30-Day Calendar Grid

The default calendar view is a 30-day grid (similar to Google Calendar). Each cell shows tasks, milestones, PR posts, meetings, and sponsor follow-ups. Click a day for full detail. Toggle between Grid and Agenda views.

---

## Member Selectors

Every internal person assignment field (assignee, reviewer, owner, designer, etc.) uses a searchable `MemberSelect` dropdown backed by the Members list. External contacts (e.g. sponsor company contacts) remain as free text.

---

## Scripts

```bash
npm run dev             # Start dev server
npm run build           # Production build
npm run preview         # Preview production build

npm run supabase:start  # Start local Supabase
npm run supabase:types  # Generate TypeScript types
npm run supabase:db:reset  # Reset local DB to seed (DANGEROUS on remote)
npm run supabase:db:push   # Push migrations to linked project
npm run supabase:status    # Show local Supabase status
```

---

## Project Structure

```
src/
  types/         TypeScript data types
  data/          Seed data
  lib/           Utilities (storage, auth, dateUtils, stats, supabaseClient)
  components/    Shared UI components (MemberSelect, Toast, etc.)
  features/      Feature pages
    auth/
    dashboard/
    projects/
    pr/
    calendar/
    meetings/
    budget/
    members/
    approvals/
    reports/
    settings/
    my-work/
  state/         AppDataContext (React Context)
  styles/        Global CSS
supabase/
  migrations/    SQL migration files
  seed.sql       Seed data for Supabase
  config.toml    Supabase project config
```

---

## Known Limitations

- Auth is hardcoded MVP auth — not production-safe.
- Supabase Auth (real email/password) is not wired yet.
- Data sync between localStorage and Supabase is not implemented — the two modes are independent.
- RLS policies are permissive MVP policies — production will need role-based restrictions.
- The chunk size warning (>500 kB) is cosmetic and does not affect functionality; code-splitting is a Phase Five task.
