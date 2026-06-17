-- ============================================================
-- RCCS Command Center — Production RLS Policies
-- Migration: 20260617000004_rls_production
--
-- Replaces the permissive Phase Four MVP policies with
-- role-aware, project-scoped policies.
--
-- Roles (from profiles.role):
--   Super Admin      — full access to everything
--   Executive Admin  — full access to everything
--   Project Admin    — manage their projects (via project_members or ownership)
--   Team Lead        — read + write operational rows for their projects
--   Contributor      — read + write tasks/action items assigned to them
--   Member           — read project data they belong to
--   Viewer           — read only
--
-- Anonymous users: NO access (no anon policies).
-- ============================================================

-- ── Drop old MVP policies ──────────────────────────────────────────────────
-- The Phase Four migration created policies named "allow_all_authenticated_*"
-- and "allow_anon_read_*". We drop them cleanly here.

do $$
declare
  r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and (policyname like 'allow_all_authenticated_%'
        or policyname like 'allow_anon_read_%')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- ── profiles ──────────────────────────────────────────────────────────────
-- All authenticated users can read profiles (needed for member selectors).
-- Users can update their own non-sensitive fields.
-- Admins can manage all.

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy "profiles_manage_admin"
  on public.profiles for all
  to authenticated
  using (public.is_executive_or_above())
  with check (public.is_executive_or_above());

-- ── project_members ────────────────────────────────────────────────────────
create policy "project_members_select"
  on public.project_members for select
  to authenticated
  using (
    public.is_executive_or_above()
    or member_id = public.current_profile_id()
    or public.can_manage_project(project_id)
  );

create policy "project_members_manage_admin"
  on public.project_members for all
  to authenticated
  using (public.can_manage_project(project_id))
  with check (public.can_manage_project(project_id));

-- ── projects ───────────────────────────────────────────────────────────────
-- RCCS is an org-wide tool: all authenticated members can read all projects.
-- Write requires project management permission.

create policy "projects_select_authenticated"
  on public.projects for select
  to authenticated
  using (true);

create policy "projects_insert_executive"
  on public.projects for insert
  to authenticated
  with check (public.is_executive_or_above());

create policy "projects_update_manager"
  on public.projects for update
  to authenticated
  using (public.can_manage_project(id))
  with check (public.can_manage_project(id));

create policy "projects_delete_admin"
  on public.projects for delete
  to authenticated
  using (public.is_executive_or_above());

-- ── phases ─────────────────────────────────────────────────────────────────
create policy "phases_select"
  on public.phases for select
  to authenticated
  using (true);

create policy "phases_write_manager"
  on public.phases for all
  to authenticated
  using (public.can_manage_project(project_id))
  with check (public.can_manage_project(project_id));

-- ── milestones ─────────────────────────────────────────────────────────────
create policy "milestones_select"
  on public.milestones for select
  to authenticated
  using (true);

create policy "milestones_write_manager"
  on public.milestones for all
  to authenticated
  using (public.can_manage_project(project_id))
  with check (public.can_manage_project(project_id));

-- ── tasks ──────────────────────────────────────────────────────────────────
create policy "tasks_select"
  on public.tasks for select
  to authenticated
  using (public.is_project_member(project_id));

create policy "tasks_insert_member"
  on public.tasks for insert
  to authenticated
  with check (public.is_project_member(project_id));

create policy "tasks_update_assignee_or_manager"
  on public.tasks for update
  to authenticated
  using (
    public.can_manage_project(project_id)
    or assignee_id = public.current_profile_id()
    or reviewer_id = public.current_profile_id()
  )
  with check (
    public.can_manage_project(project_id)
    or assignee_id = public.current_profile_id()
    or reviewer_id = public.current_profile_id()
  );

create policy "tasks_delete_manager"
  on public.tasks for delete
  to authenticated
  using (public.can_manage_project(project_id));

-- ── pr_campaigns ───────────────────────────────────────────────────────────
create policy "pr_campaigns_select"
  on public.pr_campaigns for select
  to authenticated
  using (public.is_project_member(project_id));

create policy "pr_campaigns_write_manager"
  on public.pr_campaigns for all
  to authenticated
  using (public.can_manage_project(project_id))
  with check (public.can_manage_project(project_id));

-- ── pr_items ───────────────────────────────────────────────────────────────
create policy "pr_items_select"
  on public.pr_items for select
  to authenticated
  using (public.is_project_member(project_id));

create policy "pr_items_insert_member"
  on public.pr_items for insert
  to authenticated
  with check (public.is_project_member(project_id));

create policy "pr_items_update_role"
  on public.pr_items for update
  to authenticated
  using (
    public.can_manage_project(project_id)
    or designer_id = public.current_profile_id()
    or caption_writer_id = public.current_profile_id()
    or reviewer_id = public.current_profile_id()
  )
  with check (
    public.can_manage_project(project_id)
    or designer_id = public.current_profile_id()
    or caption_writer_id = public.current_profile_id()
    or reviewer_id = public.current_profile_id()
  );

create policy "pr_items_delete_manager"
  on public.pr_items for delete
  to authenticated
  using (public.can_manage_project(project_id));

-- ── meetings ───────────────────────────────────────────────────────────────
create policy "meetings_select"
  on public.meetings for select
  to authenticated
  using (
    project_id is null
    or public.is_project_member(project_id)
  );

create policy "meetings_write_member"
  on public.meetings for insert
  to authenticated
  with check (
    project_id is null and public.is_executive_or_above()
    or (project_id is not null and public.is_project_member(project_id))
  );

create policy "meetings_update_manager"
  on public.meetings for update
  to authenticated
  using (
    project_id is null and public.is_executive_or_above()
    or (project_id is not null and public.can_manage_project(project_id))
  );

create policy "meetings_delete_manager"
  on public.meetings for delete
  to authenticated
  using (
    project_id is null and public.is_executive_or_above()
    or (project_id is not null and public.can_manage_project(project_id))
  );

-- ── meeting_attendees / decisions / action_items ────────────────────────────
create policy "meeting_attendees_select"
  on public.meeting_attendees for select
  to authenticated
  using (true);

create policy "meeting_attendees_write"
  on public.meeting_attendees for all
  to authenticated
  using (true) with check (true);

create policy "meeting_decisions_select"
  on public.meeting_decisions for select
  to authenticated
  using (true);

create policy "meeting_decisions_write"
  on public.meeting_decisions for all
  to authenticated
  using (true) with check (true);

create policy "meeting_action_items_select"
  on public.meeting_action_items for select
  to authenticated
  using (true);

-- Action item assignee can update their own
create policy "meeting_action_items_update"
  on public.meeting_action_items for update
  to authenticated
  using (
    owner_id = public.current_profile_id()
    or public.is_executive_or_above()
  );

create policy "meeting_action_items_insert_delete"
  on public.meeting_action_items for insert
  to authenticated
  with check (true);

create policy "meeting_action_items_delete_exec"
  on public.meeting_action_items for delete
  to authenticated
  using (public.is_executive_or_above());

-- ── sponsors (finance-sensitive) ───────────────────────────────────────────
create policy "sponsors_select_member"
  on public.sponsors for select
  to authenticated
  using (public.is_project_member(project_id));

create policy "sponsors_write_finance"
  on public.sponsors for all
  to authenticated
  using (public.can_write_finance(project_id))
  with check (public.can_write_finance(project_id));

-- ── sponsor_deliverables ───────────────────────────────────────────────────
create policy "sponsor_deliverables_select"
  on public.sponsor_deliverables for select
  to authenticated
  using (
    exists (
      select 1 from public.sponsors s
      where s.id = sponsor_id
        and public.is_project_member(s.project_id)
    )
  );

create policy "sponsor_deliverables_write"
  on public.sponsor_deliverables for all
  to authenticated
  using (
    exists (
      select 1 from public.sponsors s
      where s.id = sponsor_id
        and public.can_write_finance(s.project_id)
    )
  )
  with check (
    exists (
      select 1 from public.sponsors s
      where s.id = sponsor_id
        and public.can_write_finance(s.project_id)
    )
  );

-- ── budgets (finance-sensitive) ────────────────────────────────────────────
create policy "budgets_select_member"
  on public.budgets for select
  to authenticated
  using (public.is_project_member(project_id));

create policy "budgets_write_finance"
  on public.budgets for all
  to authenticated
  using (public.can_write_finance(project_id))
  with check (public.can_write_finance(project_id));

-- ── transactions (finance-sensitive) ───────────────────────────────────────
create policy "transactions_select_member"
  on public.transactions for select
  to authenticated
  using (public.is_project_member(project_id));

create policy "transactions_write_finance"
  on public.transactions for all
  to authenticated
  using (public.can_write_finance(project_id))
  with check (public.can_write_finance(project_id));

-- ── approval_requests ──────────────────────────────────────────────────────
create policy "approvals_select"
  on public.approval_requests for select
  to authenticated
  using (
    public.is_executive_or_above()
    or requested_by_id = public.current_profile_id()
    or approver_id     = public.current_profile_id()
    or (project_id is not null and public.is_project_member(project_id))
  );

create policy "approvals_insert"
  on public.approval_requests for insert
  to authenticated
  with check (true);

create policy "approvals_update"
  on public.approval_requests for update
  to authenticated
  using (
    public.is_executive_or_above()
    or approver_id = public.current_profile_id()
    or requested_by_id = public.current_profile_id()
  );

create policy "approvals_delete_admin"
  on public.approval_requests for delete
  to authenticated
  using (public.is_executive_or_above());

-- ── file_links ─────────────────────────────────────────────────────────────
create policy "file_links_select"
  on public.file_links for select
  to authenticated
  using (public.is_project_member(project_id));

create policy "file_links_write_member"
  on public.file_links for insert
  to authenticated
  with check (public.is_project_member(project_id));

create policy "file_links_update_owner_or_manager"
  on public.file_links for update
  to authenticated
  using (
    public.can_manage_project(project_id)
    or owner_id = public.current_profile_id()
  );

create policy "file_links_delete_manager"
  on public.file_links for delete
  to authenticated
  using (public.can_manage_project(project_id));

-- ── reports ────────────────────────────────────────────────────────────────
create policy "reports_select_member"
  on public.reports for select
  to authenticated
  using (public.is_project_member(project_id));

create policy "reports_write_manager"
  on public.reports for all
  to authenticated
  using (public.can_manage_project(project_id))
  with check (public.can_manage_project(project_id));

-- ── app_settings ───────────────────────────────────────────────────────────
create policy "app_settings_select_authenticated"
  on public.app_settings for select
  to authenticated
  using (true);

create policy "app_settings_write_superadmin"
  on public.app_settings for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
