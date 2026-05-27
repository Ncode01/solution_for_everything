# FlowCanvas — Live Project Status

> Last updated: Tuesday, May 26, 2026

## Current Phase: Phase 6A — Runtime Activation + Auth + Task CRUD + Viewport

**Status:** Code complete. **Gate 0 blocked** until a real Neon `DATABASE_URL` is set (not the example placeholder).

## Phase 6A Progress

- [x] Idempotent demo seed (`pnpm db:seed` prints ORG_ID, PROJECTS, TASKS, DEPENDENCIES)
- [x] Better Auth email/password (separate `auth_*` tables from domain `users`)
- [x] Next.js `/api/auth/[...all]` + `/login` + middleware gating
- [x] `pnpm auth:seed` → `owner@flowcanvas.dev` / `demo12345`
- [x] Task routes: `POST /api/tasks`, `PATCH /api/tasks/:taskId`
- [x] TanStack mutations with optimistic update + rollback
- [x] RightPanel modes: task-view / task-edit / task-create
- [x] Commands: `T` new-task, `E` edit-selected-task
- [x] Viewport persistence: `canvas_positions` + debounced PUT/GET
- [x] Diagnostic v2.0 (`pnpm diagnose`)
- [ ] **Gate 0:** Real Neon URL → `pnpm db:push` → `pnpm db:seed` → set `NEXT_PUBLIC_ORG_ID`

### Not in this session

- [ ] Dependency editing
- [ ] Task delete
- [ ] Collaborative presence cursors
- [ ] Backend route authorization hardening
- [ ] Firebase task mutation events

## Gate 0 checklist

```bash
cp .env.server.example .env.server   # paste Neon URL with ?sslmode=require
cp .env.local.example .env.local     # copy DATABASE_URL + auth secrets

pnpm db:push
pnpm db:seed                         # copy ORG_ID into .env.local
pnpm auth:seed
pnpm dev:all

curl http://localhost:3001/health
curl http://localhost:3001/api/graph/$ORG_ID
pnpm diagnose
```

## Dev Commands

```bash
pnpm dev:all
pnpm db:push
pnpm db:seed
pnpm auth:seed
pnpm diagnose
pnpm build
pnpm typecheck
pnpm typecheck:server
```

## Known Issues

1. Placeholder `DATABASE_URL` prevents DB push/seed until replaced with Neon connection string.
2. `DATABASE_URL` must exist in **both** `.env.server` (Fastify/Drizzle) and `.env.local` (Better Auth Next routes).
3. Firebase env vars remain optional.
