# Auth, Security, and RLS — RCCS Command Center

## Current Auth State (Phase Five)

### Supabase Mode (when env vars are set)
- **Login**: `supabase.auth.signInWithPassword({ email, password })`
- **Session**: managed by Supabase JS client via `localStorage` cookie (auto-persisted)
- **Auth state changes**: listened to via `supabase.auth.onAuthStateChange()`
- **Profile fetch**: after login, `profiles` is queried where `auth_user_id = auth.uid()`
- **Profile not linked**: if no profile row matches, user sees a "Profile Not Linked" screen with their UUID and admin instructions
- **Logout**: `supabase.auth.signOut()`

### Local Demo Mode (when env vars are missing)
- Hardcoded username/password in `src/lib/auth.ts`
- Session stored in `localStorage` under `rccs_session`
- **WARNING**: plaintext passwords, no JWT, no server validation
- Must never be exposed publicly or used with real data

---

## Profile Mapping

```
auth.users (Supabase Auth)
    └── id (UUID)
         │
         └── profiles.auth_user_id  (nullable)
                  │
                  └── profiles.id → used for all app-level ownership and RLS
```

After creating a Supabase auth user, an admin must manually link:
```sql
update public.profiles
set auth_user_id = '<auth_user_uuid>'
where username = 'target-username';
```

See `supabase/dev_link_profiles_example.sql` for examples.

---

## Roles

| Role | Scope |
|------|-------|
| Super Admin | Full access to all data |
| Executive Admin | Full access to all data |
| Project Admin | Manage their own projects (owner or project_members) |
| Team Lead | Read + write operational rows for their projects |
| Contributor | Read + write tasks/action items assigned to them |
| Member | Read project data for projects they belong to |
| Viewer | Read only |

Project-level roles are stored in `project_members.project_role`:
- Project Admin
- Team Lead
- Contributor
- Viewer

---

## RLS Helper Functions

Defined in `supabase/migrations/20260617000003_rls_helpers.sql`:

| Function | Returns |
|----------|---------|
| `current_profile_id()` | `profiles.id` for `auth.uid()` |
| `current_user_role()` | `profiles.role` for `auth.uid()` |
| `is_super_admin()` | true if role = Super Admin |
| `is_executive_or_above()` | true if role in Super Admin, Executive Admin |
| `can_manage_project(uuid)` | true if exec/admin or project owner or Project Admin |
| `is_project_member(uuid)` | true if exec/admin or project owner or any role in project_members |
| `can_write_finance(uuid)` | delegates to `can_manage_project` |

All functions use `SECURITY DEFINER` to bypass RLS for meta-lookups.

---

## Policy Summary (Phase Five)

| Table | Select | Insert | Update | Delete |
|-------|--------|--------|--------|--------|
| profiles | all auth | — | own row or exec | exec |
| projects | all auth | exec | project manager | exec |
| phases/milestones | all auth | project manager | project manager | project manager |
| tasks | project members | project members | manager or assignee/reviewer | manager |
| pr_items | project members | project members | manager or designer/writer/reviewer | manager |
| meetings | project members | project members | manager | manager |
| sponsors/budgets/transactions | project members | finance role | finance role | finance role |
| approval_requests | requester/approver/exec | any auth | approver/requester/exec | exec |
| audit_logs | exec/project manager | any auth | — | — |
| app_settings | any auth | — | Super Admin | Super Admin |

**No anonymous read or write access.**

---

## Known Security Limitations

1. **Profile email/phone fields** are readable by all authenticated users. Production should consider restricting these to admins or self.
2. **Meeting action items** have broadly permissive insert policies (any authenticated user). This is intentional for ease of use.
3. **The anon key** is exposed in the browser (as with all Supabase frontend apps). RLS is the security boundary.
4. **Hardcoded demo auth** is only active in local mode. It must be removed or gated before any public exposure.
5. **No email verification** is enforced at the app level. Supabase Dashboard settings should require email confirmation for production.
6. **Audit log insert** is open to all authenticated users (app writes logs). The app never lets users manually insert arbitrary log entries through the UI.

---

## Future Phase Six

- Enforce email verification.
- Add MFA support via Supabase Auth.
- Restrict `profiles.email`/`phone` to admins or self.
- Add per-row user tracking for tasks (created_by).
- Add Supabase Vault for sensitive config values.
