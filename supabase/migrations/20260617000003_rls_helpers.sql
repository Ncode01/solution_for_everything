-- ============================================================
-- RCCS Command Center — RLS Helper Functions
-- Migration: 20260617000003_rls_helpers
--
-- Helper functions used by RLS policies.
-- Called with SECURITY DEFINER to bypass RLS for meta-lookups.
-- ============================================================

-- Returns the profiles.id for the currently authenticated user.
create or replace function public.current_profile_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select id from public.profiles
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- Returns the role for the currently authenticated user.
create or replace function public.current_user_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- Returns true if the current user is a Super Admin.
create or replace function public.is_super_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and role = 'Super Admin'
  );
$$;

-- Returns true if the current user is Super Admin or Executive Admin.
create or replace function public.is_executive_or_above()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and role in ('Super Admin', 'Executive Admin')
  );
$$;

-- Returns true if the current user can manage a given project:
--   - Super Admin / Executive Admin always can
--   - Project owner can
--   - Project Admin in project_members can
create or replace function public.can_manage_project(target_project_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select
    public.is_executive_or_above()
    or exists (
      select 1 from public.projects p
      where p.id = target_project_id
        and p.owner_id = public.current_profile_id()
    )
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = target_project_id
        and pm.member_id  = public.current_profile_id()
        and pm.project_role = 'Project Admin'
    );
$$;

-- Returns true if the current user is a member of (belongs to) a project.
-- (any role in project_members, or owner, or executive)
create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select
    public.is_executive_or_above()
    or exists (
      select 1 from public.projects p
      where p.id = target_project_id
        and p.owner_id = public.current_profile_id()
    )
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = target_project_id
        and pm.member_id  = public.current_profile_id()
    );
$$;

-- Returns true if current user can write finance records for a project.
-- Finance: Super Admin, Executive Admin, project owner, or Project Admin.
create or replace function public.can_write_finance(target_project_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.can_manage_project(target_project_id);
$$;
