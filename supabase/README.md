# Supabase Setup — RCCS Command Center

## Local Development

```bash
# Start local Supabase stack (requires Docker)
supabase start

# Apply migrations to local DB
supabase db reset

# Stop local Supabase
supabase stop
```

## Linking to Remote Project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

## Push Migrations to Remote

```bash
supabase db push
```

## Generate TypeScript Types

```bash
supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > src/types/supabase.ts
# Or via npm script:
npm run supabase:types
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Never commit `.env.local` or any file containing real keys.**

## Schema

See `migrations/20260617000000_init_schema.sql` for the full 19-table schema.

## Seed Data

`seed.sql` contains realistic RCCS seed data for local development:
- 8 profiles
- 6 projects (BTUI, SparkIT, Tesseract, Digitalizer, Syntax, PROTOX)
- Phases, milestones, tasks, PR items, meetings, sponsors, transactions, approvals, file links

## RLS Policies

See `migrations/20260617000001_rls_policies.sql`.

> **Warning**: The current RLS policies are permissive MVP policies that allow all authenticated and anonymous users full access. This is intentional for Phase Four development but **must be replaced** with role-based policies before any production deployment.
