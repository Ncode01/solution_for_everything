-- Phase Six: deliverables, event_day_items, activity_items
-- Run after Phase Five migrations.

-- ============================================================
-- deliverables
-- ============================================================
create table if not exists public.deliverables (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid not null references public.projects(id) on delete cascade,
  phase_id             uuid references public.phases(id) on delete set null,
  milestone_id         uuid references public.milestones(id) on delete set null,
  title                text not null,
  type                 text not null default 'Other',
  description          text,
  owner_id             uuid references public.profiles(id) on delete set null,
  due_date             date,
  status               text not null default 'Not Started',
  file_link_id         uuid references public.file_links(id) on delete set null,
  approval_request_id  uuid references public.approval_requests(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.deliverables enable row level security;

-- Members can read deliverables for their projects; project managers can write
create policy "deliverables_select" on public.deliverables
  for select using (
    is_super_admin()
    or is_executive_or_above()
    or is_project_member(project_id)
  );

create policy "deliverables_insert" on public.deliverables
  for insert with check (
    is_super_admin()
    or is_executive_or_above()
    or can_manage_project(project_id)
  );

create policy "deliverables_update" on public.deliverables
  for update using (
    is_super_admin()
    or is_executive_or_above()
    or can_manage_project(project_id)
  );

create policy "deliverables_delete" on public.deliverables
  for delete using (
    is_super_admin()
    or is_executive_or_above()
    or can_manage_project(project_id)
  );

-- ============================================================
-- event_day_items
-- ============================================================
create table if not exists public.event_day_items (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  title           text not null,
  category        text not null default 'Logistics',
  owner_id        uuid references public.profiles(id) on delete set null,
  scheduled_time  text,
  status          text not null default 'Not Ready',
  priority        text not null default 'Normal',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.event_day_items enable row level security;

create policy "event_day_items_select" on public.event_day_items
  for select using (
    is_super_admin()
    or is_executive_or_above()
    or is_project_member(project_id)
  );

create policy "event_day_items_insert" on public.event_day_items
  for insert with check (
    is_super_admin()
    or is_executive_or_above()
    or is_project_member(project_id)
  );

create policy "event_day_items_update" on public.event_day_items
  for update using (
    is_super_admin()
    or is_executive_or_above()
    or is_project_member(project_id)
  );

create policy "event_day_items_delete" on public.event_day_items
  for delete using (
    is_super_admin()
    or is_executive_or_above()
    or can_manage_project(project_id)
  );

-- ============================================================
-- activity_items
-- ============================================================
create table if not exists public.activity_items (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references public.projects(id) on delete cascade,
  actor_id      uuid references public.profiles(id) on delete set null,
  type          text not null default 'general',
  summary       text not null,
  related_type  text,
  related_id    uuid,
  created_at    timestamptz not null default now()
);

alter table public.activity_items enable row level security;

-- Anyone authenticated can read activity; authenticated users can insert
create policy "activity_items_select" on public.activity_items
  for select using (auth.role() = 'authenticated');

create policy "activity_items_insert" on public.activity_items
  for insert with check (auth.role() = 'authenticated');

-- No updates or deletes — activity is append-only
