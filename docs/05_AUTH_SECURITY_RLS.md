# Auth and Security — Phase One

## Current Status: Temporary MVP Auth Only

Phase One uses hardcoded username/password authentication stored in `src/lib/auth.ts`.

This is **not production security**. It exists purely to demo the login flow.

### What it does

- 3 hardcoded users with plaintext passwords
- Session stored in `localStorage` as a JSON object
- No JWT, no token expiry, no server-side validation
- No password hashing

### What it does NOT do

- No real authentication
- No role enforcement (role is displayed in UI only)
- No protection against data access by other browser users
- No audit log
- No rate limiting

## Phase Two Replacement Plan

When Phase Two begins, replace with:

1. **Supabase Auth** — email/password login with JWT tokens
2. **Row Level Security (RLS)** — Supabase policies to control data access per user role
3. **Session management** — Use Supabase session, not localStorage manually
4. **Password hashing** — Handled by Supabase Auth automatically

## Roles (For Display Only in Phase One)

| Role | Username | Intended Access |
|------|----------|-----------------|
| Super Admin | admin | Full access to everything |
| Executive Admin | secretary | View all, create projects, approve items |
| Member | member | View assigned tasks, update status |

Role-based access control is **not** enforced in Phase Two either. The logged-in user's role is shown in the topbar for display only; all logged-in users can access all modules. Real RLS/role enforcement is deferred to Phase Three (Supabase).

## Phase Two Status (unchanged auth)

Phase Two intentionally keeps the temporary hardcoded auth. No auth changes were made:

- Still 3 hardcoded plaintext users in `src/lib/auth.ts`
- Still localStorage session, no JWT, no hashing, no server validation
- The MVP auth warning comment in `src/lib/auth.ts` must remain
- New modules (Members, Sponsors, Budget, etc.) do **not** add any real security layer

When user data becomes sensitive (real contact numbers, real finances), replace auth with Supabase Auth + RLS before deployment.
