-- ============================================================
-- dev_link_profiles_example.sql
--
-- LOCAL / DEV HELPER ONLY — DO NOT RUN ON PRODUCTION
--
-- After creating auth users in Supabase Dashboard or via
-- supabase CLI, copy each user's UUID from auth.users and
-- update the matching profile row.
--
-- Steps:
-- 1. Create a user in Supabase Dashboard > Auth > Users
--    (or: supabase auth admin create-user --email admin@rccs.lk --password securepass)
-- 2. Copy the UUID from the users list.
-- 3. Run a query like the one below to link the profile.
-- ============================================================

-- Example: link the RCCS Admin profile to a Supabase auth user
-- Replace <AUTH_USER_UUID> with the actual UUID from auth.users

update public.profiles
set auth_user_id = '<AUTH_USER_UUID>'
where username = 'rccs-admin'
  and auth_user_id is null;

-- Example: link the Secretary profile
update public.profiles
set auth_user_id = '<AUTH_USER_UUID_2>'
where username = 'secretary'
  and auth_user_id is null;

-- To verify the link:
select id, display_name, role, username, auth_user_id
from public.profiles
order by display_name;

-- To see all auth users (local Supabase only — not available via anon key):
-- select id, email, created_at from auth.users;
