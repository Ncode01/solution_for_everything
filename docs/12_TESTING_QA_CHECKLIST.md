# Testing / QA Checklist

No automated tests in this MVP. Use this manual checklist before considering changes done.

## Build
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] No console-breaking runtime errors during normal use

## Regression (Phase One must still work)
- [ ] Login as admin; logout returns to login
- [ ] Session persists after refresh
- [ ] Dashboard loads with stats
- [ ] Projects list + project detail open
- [ ] Create/edit phases, milestones, tasks; change status/priority
- [ ] Create/edit PR items
- [ ] Calendar shows task/milestone/PR/event dates
- [ ] Data persists in localStorage after refresh

## Phase Two Manual Checks
- [ ] Attention Center bell shows a count; panel lists items
- [ ] Create a member; filter by committee/workload
- [ ] Create a meeting with decisions + action items; convert an action item to a task; copy summary
- [ ] Create a sponsor with a follow-up date; update stage + payment status inline
- [ ] Create a transaction; surplus/usage update; missing-receipt warning shows for expenses
- [ ] Create an approval; change status; appears in dashboard pending
- [ ] Add a file link to BTUI; open link
- [ ] Generate a BTUI report; copy to clipboard; print; save
- [ ] Global search "BTUI"; click a result navigates correctly
- [ ] Calendar: click a PR item navigates to project; project filter works
- [ ] PR Planner: Needs approval / Ready to post / This week sections + missing-field warnings
- [ ] Data Tools: export JSON; import JSON (with confirm); reset demo data; last-saved time shows
- [ ] Import an invalid file → error message, no crash
- [ ] Mobile width: sidebar drawer, stacked cards, tappable buttons, forms/modals fit
- [ ] Login as a member account; app still usable
