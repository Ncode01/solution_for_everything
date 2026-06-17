# Prompt Log

## Phase Four — June 17, 2026

### Summary

Major implementation pass: Supabase CLI migration, 30-day calendar grid, member selectors everywhere, My Work page, UI polish, and 10 extra improvements.

### Files Created

- `supabase/config.toml`
- `supabase/migrations/20260617000000_init_schema.sql`
- `supabase/migrations/20260617000001_rls_policies.sql`
- `supabase/seed.sql`
- `.env.example`
- `src/lib/supabaseClient.ts`
- `src/lib/dataProvider.ts`
- `src/lib/csvExport.ts`
- `src/lib/recentProjects.ts`
- `src/types/supabase.ts`
- `src/vite-env.d.ts`
- `src/components/MemberSelect.tsx`
- `src/components/MultiMemberSelect.tsx`
- `src/components/Toast.tsx`
- `src/features/my-work/MyWorkPage.tsx`

### Files Modified

- `package.json` — added @supabase/supabase-js, supabase:* scripts
- `.gitignore` — Supabase, env, OS ignores
- `src/types/index.ts` — added *Id fields, pinned/notes to Project
- `src/App.tsx` — added /my-work route
- `src/main.tsx` — wrapped with ToastProvider
- `src/styles/global.css` — slide-up keyframes
- `src/components/Sidebar.tsx` — My Work nav, connection mode badge
- `src/components/EmptyState.tsx` — flexible icon prop
- `src/features/projects/ProjectsPage.tsx` — pin/unpin, resolved owner names
- `src/features/projects/ProjectDetailPage.tsx` — smart warnings, recent view tracking, member ID display
- `src/features/projects/TaskForm.tsx` — MemberSelect for assignee/reviewer
- `src/features/projects/MilestoneForm.tsx` — MemberSelect for owner
- `src/features/projects/ProjectForm.tsx` — (reviewed)
- `src/features/pr/PRItemForm.tsx` — MemberSelect for designer/caption/reviewer
- `src/features/pr/PRPlannerPage.tsx` — passes members prop
- `src/features/meetings/MeetingForm.tsx` — MultiMemberSelect attendees, MemberSelect decision/action owners
- `src/features/meetings/MeetingsPage.tsx` — passes members prop
- `src/features/budget/BudgetPage.tsx` — CSV export for transactions
- `src/features/budget/TransactionForm.tsx` — MemberSelect for paidBy/approvedBy
- `src/features/budget/BudgetForm.tsx` — (reviewed)
- `src/features/approvals/ApprovalForm.tsx` — MemberSelect for requestedBy/approver
- `src/features/approvals/ApprovalsPage.tsx` — passes members prop
- `src/features/files/FileLinkForm.tsx` — MemberSelect for owner
- `src/features/files/FilesPanel.tsx` — passes members prop
- `src/features/sponsors/SponsorForm.tsx` — MemberSelect for assignedMember
- `src/features/sponsors/SponsorsPage.tsx` — passes members prop
- `src/features/calendar/CalendarPage.tsx` — 30-day grid, day modal, filters, agenda toggle
- `src/features/dashboard/DashboardPage.tsx` — recently viewed projects section
- `src/features/settings/DataToolsPage.tsx` — connection mode display

### Checks Run

- `npm run build` — passed, zero TypeScript errors.
- Verified local fallback (no env vars) does not crash.
- Verified member selector renders in all forms.
- Verified calendar grid default view.

### Docs Updated

- `README.md`
- `CHANGELOG.md`
- `AGENTS.md`
- `docs/09_PROMPT_LOG.md` (this file)

---

## Previous Phases

Earlier phases are documented inline in CHANGELOG.md.
