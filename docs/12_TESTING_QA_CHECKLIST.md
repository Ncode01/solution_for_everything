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
# RCCS OS Visual QA Additions

## Visual System

- Confirm sidebar renders as RCCS OS glass rail on desktop.
- Confirm mobile opens sidebar through the top-left menu and does not horizontally overflow.
- Confirm topbar search, command hint, attention button, connection chip, profile pill, and logout fit on desktop and mobile.
- Confirm glass is limited to chrome/control/overlay surfaces; dense rows remain readable.
- Confirm reduced motion and reduced transparency fallbacks are defined in CSS.

## Screen Checks

- Today: hero command strip, stat capsules, attention rows, project health, and mobile row behavior.
- Focus: personal workload sections remain readable.
- Calendar: rolling previous-30/today/next-30 range aligns to weekday columns; day inspector still opens.
- Project Detail: exactly seven tabs remain: Overview, Timeline, Tasks, Launches, Meetings, Money, Approvals.
- Launches: five-lane publishing pipeline and full work list both render.
- Money: numeric hierarchy stays aligned and readable.
- People: overloaded/available rails and member cards render without badge clutter.
- Library: segmented sections switch correctly.
- System: health/backups/security panels remain readable.
- Event-Day: Now / Next / Problems strip, readiness, problem section, and checklist actions work on mobile.

## Commands

- Run `npm run build`.
- Run `npm run lint` or `npm run test` if scripts are added later.
- Capture desktop screenshots for login, Today, Calendar, Launches, Money, People, Library, System, Event-Day.
- Capture at least one mobile screenshot for Today or Event-Day.
