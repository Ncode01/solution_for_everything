# Supabase Setup — RCCS Command Center

## Migrations

| File | Description |
|------|-------------|
| `20260617000000_init_schema.sql` | Full 19-table schema |
| `20260617000001_rls_policies.sql` | Phase Four MVP policies (replaced by migration 4) |
| `20260617000002_project_members.sql` | `project_members` table for project-level access |
| `20260617000003_rls_helpers.sql` | Helper SQL functions (`current_profile_id`, `is_executive_or_above`, etc.) |
| `20260617000004_rls_production.sql` | Production RLS policies — replaces permissive Phase Four policies |
| `20260617000005_audit_log.sql` | `audit_logs` table |

---

## Local Development

```bash
# Requires Docker
supabase start

# Apply all migrations + seed data
supabase db reset

# Stop local Supabase
supabase stop

# Check status
supabase status
```

---

## Linking to Remote Project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

## Push Migrations to Remote

```bash
# Dry-run first (review what will change)
supabase db push --dry-run

# Push for real
supabase db push
```

## Generate TypeScript Types

After linking:

```bash
supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > src/types/supabase.ts
# or:
npm run supabase:types
```

---

## Environment Variables

Copy `.env.example` to `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Never commit `.env.local` or any real keys.**

---

## Admin Setup (First Run)

### 1. Push schema

```bash
supabase db push
```

### 2. Create the first admin user

Via Supabase Dashboard → Authentication → Users → Add user:
- Email: `admin@rccs.lk`
- Password: (choose a strong one)

Or via CLI (local dev only):
```bash
supabase auth admin create-user --email admin@rccs.lk --password CHANGE_ME
```

### 3. Copy the auth user UUID

In Dashboard → Authentication → Users, copy the UUID of the new user.

### 4. Link the profile

In Dashboard → SQL Editor, run:

```sql
update public.profiles
set auth_user_id = 'PASTE_UUID_HERE'
where username = 'rccs-admin';
```

See `dev_link_profiles_example.sql` for more examples.

### 5. Verify

Log in to the app with the admin email and password.
You should be redirected to the Dashboard.

---

## RLS Policy Summary

After Phase Five migrations:

- **No anonymous write access** — all tables require authentication.
- **Profiles**: all authenticated users can read; only own record can be updated; admins manage all.
- **Projects**: all authenticated users can read; only project managers can write.
- **Finance tables** (sponsors, budgets, transactions): only project managers and admins can write.
- **Audit logs**: insert by authenticated; read by admins and project managers; no update/delete.
- **Tasks**: assignees can update their own tasks; project members can insert; managers delete.
- **Approvals**: requester and approver can read/update their own records.

See `20260617000004_rls_production.sql` for the full policy set.

---

## Seed Data

`seed.sql` contains realistic local dev data:
- 8 profiles (auth_user_id is null — link manually as above)
- 6 projects: BTUI, SparkIT, Tesseract, Digitalizer, Syntax, PROTOX
- Phases, milestones, tasks, PR items, meetings, sponsors, transactions, approvals, file links

> After seeding, update `profiles.auth_user_id` to link real auth users.
