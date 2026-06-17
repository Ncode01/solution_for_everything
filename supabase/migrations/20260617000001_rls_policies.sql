-- ============================================================
-- RCCS Command Center — Row Level Security Policies
-- Migration: 20260617000001_rls_policies
--
-- ⚠️  TEMPORARY MVP POLICIES — Phase Four
-- These policies are permissive to allow the app to work
-- before full Supabase Auth is wired up.
-- 
-- TODO (Phase Five — Production):
-- - Replace authenticated + anon policies with role-based rules
-- - Finance/sponsor/member contact data must be restricted by role
-- - Add per-project access control
-- - See docs/05_AUTH_SECURITY_RLS.md for the full plan
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles           enable row level security;
alter table public.projects           enable row level security;
alter table public.phases             enable row level security;
alter table public.milestones         enable row level security;
alter table public.tasks              enable row level security;
alter table public.pr_campaigns       enable row level security;
alter table public.pr_items           enable row level security;
alter table public.meetings           enable row level security;
alter table public.meeting_attendees  enable row level security;
alter table public.meeting_decisions  enable row level security;
alter table public.meeting_action_items enable row level security;
alter table public.sponsors           enable row level security;
alter table public.sponsor_deliverables enable row level security;
alter table public.budgets            enable row level security;
alter table public.transactions       enable row level security;
alter table public.approval_requests  enable row level security;
alter table public.file_links         enable row level security;
alter table public.reports            enable row level security;
alter table public.app_settings       enable row level security;

-- ─── MVP Policies: authenticated users can do everything ─────────────────────
-- Replace these in production with fine-grained role/project checks.

do $$
declare
  tbl text;
  tables text[] := array[
    'profiles', 'projects', 'phases', 'milestones', 'tasks',
    'pr_campaigns', 'pr_items', 'meetings', 'meeting_attendees',
    'meeting_decisions', 'meeting_action_items', 'sponsors',
    'sponsor_deliverables', 'budgets', 'transactions',
    'approval_requests', 'file_links', 'reports', 'app_settings'
  ];
begin
  foreach tbl in array tables loop
    execute format(
      'create policy "MVP: authenticated full access" on public.%I
       for all to authenticated using (true) with check (true)',
      tbl
    );
  end loop;
end $$;

-- ─── Temporary: allow anon read access (for local dev without auth) ───────────
-- ⚠️  Remove this in production. Only needed while hardcoded auth is active.
do $$
declare
  tbl text;
  tables text[] := array[
    'profiles', 'projects', 'phases', 'milestones', 'tasks',
    'pr_campaigns', 'pr_items', 'meetings', 'meeting_attendees',
    'meeting_decisions', 'meeting_action_items', 'sponsors',
    'sponsor_deliverables', 'budgets', 'transactions',
    'approval_requests', 'file_links', 'reports', 'app_settings'
  ];
begin
  foreach tbl in array tables loop
    execute format(
      'create policy "MVP: anon read access" on public.%I
       for select to anon using (true)',
      tbl
    );
    execute format(
      'create policy "MVP: anon write access" on public.%I
       for all to anon using (true) with check (true)',
      tbl
    );
  end loop;
end $$;
