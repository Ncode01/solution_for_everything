-- ============================================================
-- RCCS Command Center — Phase Four Initial Schema
-- Migration: 20260617000000_init_schema
-- Run: supabase db push   (or supabase db reset for local dev)
-- ============================================================

-- ─── Updated-at trigger function ─────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                  uuid primary key default gen_random_uuid(),
  auth_user_id        uuid unique,          -- nullable until Supabase Auth is wired
  username            text unique,
  display_name        text not null,
  role                text not null,
  committee           text,
  grade_or_class      text,
  email               text,
  phone               text,
  skills              text[] default '{}',
  availability_status text not null default 'Available',
  workload_level      text not null default 'Normal',
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create index if not exists profiles_auth_user_id_idx on public.profiles(auth_user_id);

-- ─── projects ────────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  year             integer not null,
  type             text not null,
  status           text not null,
  priority         text not null,
  description      text,
  owner_id         uuid references public.profiles(id) on delete set null,
  start_date       date,
  end_date         date,
  final_event_date date,
  progress         integer not null default 0 check (progress between 0 and 100),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger projects_updated_at before update on public.projects
  for each row execute procedure public.handle_updated_at();

create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_owner_id_idx on public.projects(owner_id);

-- ─── phases ──────────────────────────────────────────────────────────────────
create table if not exists public.phases (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  description text,
  owner_id    uuid references public.profiles(id) on delete set null,
  start_date  date,
  end_date    date,
  status      text not null,
  progress    integer not null default 0 check (progress between 0 and 100),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger phases_updated_at before update on public.phases
  for each row execute procedure public.handle_updated_at();

create index if not exists phases_project_id_idx on public.phases(project_id);

-- ─── milestones ──────────────────────────────────────────────────────────────
create table if not exists public.milestones (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  phase_id    uuid references public.phases(id) on delete set null,
  name        text not null,
  due_date    date,
  owner_id    uuid references public.profiles(id) on delete set null,
  status      text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger milestones_updated_at before update on public.milestones
  for each row execute procedure public.handle_updated_at();

create index if not exists milestones_project_id_idx on public.milestones(project_id);
create index if not exists milestones_due_date_idx on public.milestones(due_date);
create index if not exists milestones_status_idx on public.milestones(status);

-- ─── tasks ───────────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  phase_id        uuid references public.phases(id) on delete set null,
  milestone_id    uuid references public.milestones(id) on delete set null,
  title           text not null,
  description     text,
  assignee_id     uuid references public.profiles(id) on delete set null,
  reviewer_id     uuid references public.profiles(id) on delete set null,
  due_date        date,
  priority        text not null,
  status          text not null,
  created_by_id   uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger tasks_updated_at before update on public.tasks
  for each row execute procedure public.handle_updated_at();

create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists tasks_assignee_id_idx on public.tasks(assignee_id);
create index if not exists tasks_due_date_idx on public.tasks(due_date);
create index if not exists tasks_status_idx on public.tasks(status);

-- ─── pr_campaigns ────────────────────────────────────────────────────────────
create table if not exists public.pr_campaigns (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  goal        text,
  start_date  date,
  end_date    date,
  status      text not null default 'Planning',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger pr_campaigns_updated_at before update on public.pr_campaigns
  for each row execute procedure public.handle_updated_at();

create index if not exists pr_campaigns_project_id_idx on public.pr_campaigns(project_id);

-- ─── pr_items ────────────────────────────────────────────────────────────────
create table if not exists public.pr_items (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  campaign_id       uuid references public.pr_campaigns(id) on delete set null,
  title             text not null,
  campaign          text,
  platform          text not null,
  publish_date      date,
  publish_time      text,
  designer_id       uuid references public.profiles(id) on delete set null,
  caption_writer_id uuid references public.profiles(id) on delete set null,
  reviewer_id       uuid references public.profiles(id) on delete set null,
  approval_status   text not null,
  publishing_status text not null,
  caption           text,
  design_link       text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger pr_items_updated_at before update on public.pr_items
  for each row execute procedure public.handle_updated_at();

create index if not exists pr_items_project_id_idx on public.pr_items(project_id);
create index if not exists pr_items_publish_date_idx on public.pr_items(publish_date);

-- ─── meetings ────────────────────────────────────────────────────────────────
create table if not exists public.meetings (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid references public.projects(id) on delete cascade,
  title            text not null,
  type             text not null,
  date             date,
  time             text,
  location         text,
  agenda           text,
  notes            text,
  next_meeting_date date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger meetings_updated_at before update on public.meetings
  for each row execute procedure public.handle_updated_at();

create index if not exists meetings_project_id_idx on public.meetings(project_id);
create index if not exists meetings_date_idx on public.meetings(date);

-- ─── meeting_attendees ───────────────────────────────────────────────────────
create table if not exists public.meeting_attendees (
  id         uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  member_id  uuid not null references public.profiles(id) on delete cascade,
  unique(meeting_id, member_id)
);

create index if not exists meeting_attendees_meeting_id_idx on public.meeting_attendees(meeting_id);

-- ─── meeting_decisions ───────────────────────────────────────────────────────
create table if not exists public.meeting_decisions (
  id            uuid primary key default gen_random_uuid(),
  meeting_id    uuid not null references public.meetings(id) on delete cascade,
  decision      text not null,
  owner_id      uuid references public.profiles(id) on delete set null,
  decision_date date,
  created_at    timestamptz not null default now()
);

create index if not exists meeting_decisions_meeting_id_idx on public.meeting_decisions(meeting_id);

-- ─── meeting_action_items ────────────────────────────────────────────────────
create table if not exists public.meeting_action_items (
  id             uuid primary key default gen_random_uuid(),
  meeting_id     uuid not null references public.meetings(id) on delete cascade,
  title          text not null,
  owner_id       uuid references public.profiles(id) on delete set null,
  due_date       date,
  status         text not null,
  linked_task_id uuid references public.tasks(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger meeting_action_items_updated_at before update on public.meeting_action_items
  for each row execute procedure public.handle_updated_at();

create index if not exists meeting_action_items_meeting_id_idx on public.meeting_action_items(meeting_id);

-- ─── sponsors ────────────────────────────────────────────────────────────────
create table if not exists public.sponsors (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects(id) on delete cascade,
  name                text not null,
  contact_person      text,
  contact_number      text,
  email               text,
  package_name        text not null,
  amount              numeric not null default 0 check (amount >= 0),
  stage               text not null,
  assigned_member_id  uuid references public.profiles(id) on delete set null,
  last_contacted_date date,
  next_follow_up_date date,
  proposal_link       text,
  agreement_link      text,
  payment_status      text not null,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger sponsors_updated_at before update on public.sponsors
  for each row execute procedure public.handle_updated_at();

create index if not exists sponsors_project_id_idx on public.sponsors(project_id);
create index if not exists sponsors_next_follow_up_date_idx on public.sponsors(next_follow_up_date);
create index if not exists sponsors_stage_idx on public.sponsors(stage);

-- ─── sponsor_deliverables ────────────────────────────────────────────────────
create table if not exists public.sponsor_deliverables (
  id         uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  title      text not null,
  due_date   date,
  status     text not null,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sponsor_deliverables_updated_at before update on public.sponsor_deliverables
  for each row execute procedure public.handle_updated_at();

create index if not exists sponsor_deliverables_sponsor_id_idx on public.sponsor_deliverables(sponsor_id);

-- ─── budgets ─────────────────────────────────────────────────────────────────
create table if not exists public.budgets (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null references public.projects(id) on delete cascade,
  expected_income    numeric not null default 0 check (expected_income >= 0),
  expected_expense   numeric not null default 0 check (expected_expense >= 0),
  confirmed_income   numeric not null default 0 check (confirmed_income >= 0),
  confirmed_expense  numeric not null default 0 check (confirmed_expense >= 0),
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique(project_id)
);

create trigger budgets_updated_at before update on public.budgets
  for each row execute procedure public.handle_updated_at();

-- ─── transactions ────────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  type           text not null,
  category       text not null,
  amount         numeric not null check (amount >= 0),
  date           date,
  paid_by_id     uuid references public.profiles(id) on delete set null,
  approved_by_id uuid references public.profiles(id) on delete set null,
  receipt_link   text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger transactions_updated_at before update on public.transactions
  for each row execute procedure public.handle_updated_at();

create index if not exists transactions_project_id_idx on public.transactions(project_id);
create index if not exists transactions_date_idx on public.transactions(date);

-- ─── approval_requests ───────────────────────────────────────────────────────
create table if not exists public.approval_requests (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid references public.projects(id) on delete cascade,
  related_type     text,
  related_id       uuid,
  title            text not null,
  description      text,
  requested_by_id  uuid references public.profiles(id) on delete set null,
  approver_id      uuid references public.profiles(id) on delete set null,
  status           text not null,
  submitted_date   date,
  decision_date    date,
  comments         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger approval_requests_updated_at before update on public.approval_requests
  for each row execute procedure public.handle_updated_at();

create index if not exists approval_requests_project_id_idx on public.approval_requests(project_id);
create index if not exists approval_requests_status_idx on public.approval_requests(status);

-- ─── file_links ──────────────────────────────────────────────────────────────
create table if not exists public.file_links (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title      text not null,
  category   text not null,
  url        text not null,
  owner_id   uuid references public.profiles(id) on delete set null,
  status     text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger file_links_updated_at before update on public.file_links
  for each row execute procedure public.handle_updated_at();

create index if not exists file_links_project_id_idx on public.file_links(project_id);

-- ─── reports ─────────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  title            text not null,
  type             text not null,
  summary          text,
  content          text not null,
  generated_by_id  uuid references public.profiles(id) on delete set null,
  generated_date   date not null default current_date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger reports_updated_at before update on public.reports
  for each row execute procedure public.handle_updated_at();

create index if not exists reports_project_id_idx on public.reports(project_id);

-- ─── app_settings ────────────────────────────────────────────────────────────
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
