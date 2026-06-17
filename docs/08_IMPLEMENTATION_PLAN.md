# Implementation Plan

## Phase One MVP — COMPLETED ✅

All acceptance criteria passed:

- [x] App runs locally (`npm run dev`)
- [x] Login screen works with all 3 hardcoded users
- [x] Logout works and returns to login screen
- [x] Session persists after browser refresh
- [x] Dashboard shows RCCS project stats
- [x] Projects page lists seeded RCCS projects
- [x] User can create a project
- [x] User can open a project detail page
- [x] User can create/edit phases
- [x] User can create/edit milestones
- [x] User can create/edit tasks
- [x] User can change task status and priority
- [x] User can create/edit PR items
- [x] Calendar shows task, milestone, PR, and event dates
- [x] Data persists in localStorage after refresh
- [x] Reset demo data works with confirmation
- [x] UI is clean and usable on desktop
- [x] UI is reasonably usable on mobile
- [x] No paid services added
- [x] `npm run build` passes with zero errors
- [x] Documentation updated

## Phase Two MVP — COMPLETED ✅

Still local-first (localStorage), no backend, no Supabase, auth unchanged.

- [x] Practicality + UI maturity pass (shared component system, layout rhythm)
- [x] Responsive sidebar drawer + topbar (global search + Attention Center)
- [x] Attention-first dashboard with quick actions and project health
- [x] Projects list sorting + counts; project detail Command Summary + tabs
- [x] Extended types and unified `AppData` model + per-collection storage
- [x] Expanded seed data (members, sponsors, budgets, transactions, meetings, approvals, files)
- [x] Members module (create/edit/delete, filters, workload)
- [x] Meetings module (decisions, action items, convert → task, copy summary)
- [x] Sponsors module (stages, payment, follow-ups, deliverables, totals)
- [x] Budget module (transactions, surplus, usage %, warnings)
- [x] Approvals module (status workflow)
- [x] File Links per project
- [x] Reports module (generate/copy/print/save)
- [x] Global search across entities
- [x] Calendar navigation + filters; PR Planner operational sections
- [x] Data Tools export/import/reset with validation
- [x] `npm run build` passes with zero errors
- [x] Documentation updated

## Recommended Phase Three Steps

1. **Replace auth** with Supabase Auth (email/password + magic link)
2. **Migrate data** to Supabase PostgreSQL (each collection → table)
3. **Add RLS policies** for real role-based access
4. **Server-side validation** and audit trail for approvals/budget
5. **In-app + email notifications** (e.g. Resend) for due dates and follow-ups
6. **Real file uploads** (Supabase Storage) alongside external links
7. **Calendar month/week grid** and Google Calendar sync
8. **Reporting/analytics** dashboard and PDF export
9. **Deploy to Vercel** with environment-based config

## Phase Four (Future / out of current scope)

- Event-day mode
- WhatsApp reminders
- AI-powered summaries
- Mobile PWA or app
