# FlowCanvas — Live Project Status

> Last updated: Tuesday, May 27, 2026

## Current Phase: Phase 6B — COMPLETE

**Status:** Dependency editing, task archive, Firebase mutation events, and CPM recompute shipped.

## Phase 6B Progress

- [x] `archivedAt` column on tasks + graph excludes archived
- [x] POST/DELETE `/api/tasks/:id/dependencies` with cycle detection
- [x] DELETE `/api/tasks/:id` soft-archive
- [x] Dependency editor in task-edit mode (chips + select)
- [x] Archive task double-confirm in task-view footer
- [x] `useMutationOrchestrator` + Firebase event publish
- [x] Incoming Firebase events invalidate/patch canvas
- [x] `useCPMSync` recomputes CPM after mutations
- [x] Diagnostic v2.0 extended (26 checks)

## Phase 6A Progress (complete)

- [x] Neon runtime, Better Auth, task CRUD, viewport persistence

### Not in this session

- [ ] Collaborative presence cursors
- [ ] Backend route authorization hardening

## Next

- Phase 7A — Gantt view
- Phase 7B — Dashboard view
