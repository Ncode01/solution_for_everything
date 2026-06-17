# Deployment Runbook — RCCS Command Center

## Build

```bash
npm run build
# Output: dist/
```

## Deployment Platforms

The app is a static SPA. It can deploy to any static hosting that supports client-side routing.

### Cloudflare Pages (recommended)

1. Connect your GitHub repo to Cloudflare Pages.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variables (see below).
5. Add a `_redirects` file or configure Cloudflare Pages for SPA routing:

```
/* /index.html 200
```

### Vercel

1. Connect your GitHub repo to Vercel.
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set environment variables (see below).
6. Vercel handles SPA routing automatically.

---

## Required Environment Variables

Set these in your hosting provider's dashboard:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL (`https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

**Never commit these to the repository.**

---

## Pre-Deployment Checklist

### Database
- [ ] `supabase db push` applied all migrations successfully
- [ ] `20260617000002_project_members.sql` applied
- [ ] `20260617000003_rls_helpers.sql` applied (helper functions exist)
- [ ] `20260617000004_rls_production.sql` applied (production RLS active)
- [ ] `20260617000005_audit_log.sql` applied

### Auth
- [ ] Supabase Auth is enabled in Supabase Dashboard → Authentication → Settings
- [ ] At least one admin user created (email + password)
- [ ] Admin profile row exists in `public.profiles` with correct `role = 'Super Admin'`
- [ ] `profiles.auth_user_id` linked to the auth user UUID

### Security
- [ ] No anon write policies remain (check Supabase Dashboard → Auth → Policies)
- [ ] RLS is enabled on all tables
- [ ] `.env.local` is NOT committed
- [ ] No real passwords in code or seed SQL

### App
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] Test login in Supabase mode
- [ ] Test logout
- [ ] Test session persists after page refresh
- [ ] Test profile not linked screen appears for unlinked users
- [ ] Test that local demo fallback works when env vars are removed
- [ ] Audit log records actions after login

---

## First Admin Setup (After Deployment)

1. Open your Supabase Dashboard → Authentication → Users.
2. Click "Add user" and create: `admin@rccs.lk` (or your preferred email).
3. Copy the user's UUID.
4. Open Supabase Dashboard → SQL Editor.
5. Run:

```sql
-- Check if seed profile exists
select id, display_name, role, auth_user_id from public.profiles;

-- Link admin profile to auth user
update public.profiles
set auth_user_id = 'PASTE_UUID_HERE'
where role = 'Super Admin'
  and auth_user_id is null
limit 1;
```

6. Log in to the app with the admin email and password.

---

## Supabase RLS Verification

After deploying, verify RLS is working:

```sql
-- Check RLS is enabled on all tables
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- All should show rowsecurity = true

-- Check no anon policies exist
select policyname, tablename, roles
from pg_policies
where schemaname = 'public'
  and 'anon' = any(roles);

-- Should return 0 rows
```

---

## Supabase CLI Commands Reference

```bash
supabase login                          # Authenticate CLI
supabase link --project-ref REF        # Link to remote project
supabase db push                        # Push migrations to remote
supabase db push --dry-run             # Preview changes without applying
supabase gen types typescript ...      # Regenerate TypeScript types
supabase status                         # Show local Supabase status (if running locally)
```

---

## Known Deployment Limitations

- **Real-time sync** is not implemented. Multiple users see updates only after page refresh.
- **File storage** uses URL links only; no file uploads (Supabase Storage not wired).
- **Email notifications** are not implemented.
- **The bundle** is ~657 kB (gzipped ~168 kB). Acceptable for internal tools. Code-splitting is partially implemented via React.lazy for large routes.
