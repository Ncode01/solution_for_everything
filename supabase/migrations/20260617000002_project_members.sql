-- ============================================================
-- RCCS Command Center — project_members table
-- Migration: 20260617000002_project_members
--
-- Enables per-project access control for RLS policies.
-- Each row links a profile to a project with a project-level role.
-- ============================================================

create table if not exists public.project_members (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  member_id   uuid not null references public.profiles(id) on delete cascade,
  project_role text not null default 'Contributor'
    check (project_role in ('Project Admin', 'Team Lead', 'Contributor', 'Viewer')),
  created_at  timestamptz not null default now(),
  unique (project_id, member_id)
);

create index if not exists idx_project_members_project on public.project_members(project_id);
create index if not exists idx_project_members_member  on public.project_members(member_id);

-- Enable RLS
alter table public.project_members enable row level security;

comment on table public.project_members is
  'Links profiles to projects with a project-level role for access control.';
comment on column public.project_members.project_role is
  'Project Admin | Team Lead | Contributor | Viewer';
