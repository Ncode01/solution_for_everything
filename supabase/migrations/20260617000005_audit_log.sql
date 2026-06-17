-- ============================================================
-- RCCS Command Center — Audit Log
-- Migration: 20260617000005_audit_log
-- ============================================================

create table if not exists public.audit_logs (
  id               uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action           text not null,
  entity_type      text not null,
  entity_id        uuid,
  project_id       uuid references public.projects(id) on delete set null,
  summary          text not null,
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now()
);

create index if not exists idx_audit_logs_project    on public.audit_logs(project_id);
create index if not exists idx_audit_logs_actor      on public.audit_logs(actor_profile_id);
create index if not exists idx_audit_logs_entity     on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- RLS
alter table public.audit_logs enable row level security;

-- Admins can read all
create policy "audit_logs_select_admin"
  on public.audit_logs for select
  to authenticated
  using (
    public.is_executive_or_above()
    or (project_id is not null and public.can_manage_project(project_id))
  );

-- Authenticated users can insert (app writes logs)
create policy "audit_logs_insert_authenticated"
  on public.audit_logs for insert
  to authenticated
  with check (true);

-- Nobody updates or deletes logs
-- (no update/delete policies = denied)

comment on table public.audit_logs is
  'Append-only audit trail of important RCCS data changes.';
comment on column public.audit_logs.action is
  'e.g. created, updated, deleted, status_changed, generated';
comment on column public.audit_logs.entity_type is
  'e.g. project, task, milestone, sponsor, transaction, approval, report';
