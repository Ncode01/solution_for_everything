# FlowCanvas — Live Project Status

> Last updated: Tuesday, May 27, 2026

## Current Phase: Phase 6A — COMPLETE

**Status:** Runtime activated against Neon. All Gate 0 checks pass. `pnpm diagnose` → 21/21 PASS.

## Phase 6A Progress

- [x] Runtime activation gate (Neon, db push, seed, graph API, ORG_ID)
- [x] Idempotent demo seed
- [x] Better Auth credentials login
- [x] Task create/update API + optimistic mutations
- [x] RightPanel task-view / task-edit / task-create
- [x] Viewport persistence (canvas_positions)
- [x] Diagnostic v2.0

### Not in this session

- [ ] Dependency editing
- [ ] Task delete
- [ ] Collaborative presence cursors
- [ ] Backend route authorization hardening
- [ ] Firebase task mutation events

## Verified counts (demo org)

- Users: 4
- Projects: 3
- Tasks: 9
- Dependencies: 7

## Dev Commands

```bash
pnpm dev:all
pnpm db:push
pnpm db:seed
pnpm auth:seed
pnpm diagnose
```

## Demo login

- Email: `owner@flowcanvas.dev`
- Password: `demo12345`
